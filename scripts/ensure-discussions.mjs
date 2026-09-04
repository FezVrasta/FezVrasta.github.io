#!/usr/bin/env node
// Ensures every non-draft post under src/content/blog has a GitHub Discussion
// to act as its comment thread, creating one if missing. Writes the resulting
// slug -> discussion URL map to src/data/discussion-links.json, which is a
// build-time artifact (gitignored) consumed by the blog post page.
//
// Requires the `gh` CLI, authenticated (GH_TOKEN / GITHUB_TOKEN in env) with
// a token that has the `discussions: write` permission on this repo.

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const blogDir = path.join(repoRoot, 'src', 'content', 'blog');
const outFile = path.join(repoRoot, 'src', 'data', 'discussion-links.json');

const OWNER = 'FezVrasta';
const REPO = 'FezVrasta.github.io';
const CATEGORY_SLUG = 'blog-comments';
const SITE_URL = 'https://fezvrasta.github.io';

function gql(query, variables = {}) {
	const args = ['api', 'graphql', '-f', `query=${query}`];
	for (const [key, value] of Object.entries(variables)) {
		if (value === null || value === undefined) continue;
		args.push('-f', `${key}=${value}`);
	}
	const out = execFileSync('gh', args, { encoding: 'utf8' });
	return JSON.parse(out);
}

function parseFrontmatterTitle(raw) {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match) return null;
	const fm = match[1];
	const titleLine = fm.match(/^title:\s*(.+)$/m);
	if (!titleLine) return null;
	let title = titleLine[1].trim();
	if (
		(title.startsWith("'") && title.endsWith("'")) ||
		(title.startsWith('"') && title.endsWith('"'))
	) {
		title = title.slice(1, -1);
	}
	return title;
}

function main() {
	const files = readdirSync(blogDir).filter((f) => f.endsWith('.mdx'));
	const posts = files
		.map((file) => {
			const slug = file.replace(/\.mdx$/, '');
			const raw = readFileSync(path.join(blogDir, file), 'utf8');
			const title = parseFrontmatterTitle(raw);
			const isDraft = /^draft:\s*true/m.test(raw);
			return { slug, title, isDraft };
		})
		.filter((p) => p.title && !p.isDraft);

	if (posts.length === 0) {
		mkdirSync(path.dirname(outFile), { recursive: true });
		writeFileSync(outFile, '{}\n');
		console.log('No posts found, wrote empty discussion-links.json');
		return;
	}

	console.log(`Found ${posts.length} post(s), checking discussions...`);

	const repoData = gql(
		`query($owner: String!, $repo: String!) {
			repository(owner: $owner, name: $repo) {
				id
				discussionCategories(first: 20) { nodes { id slug } }
			}
		}`,
		{ owner: OWNER, repo: REPO },
	);
	const repositoryId = repoData.data.repository.id;
	const category = repoData.data.repository.discussionCategories.nodes.find(
		(c) => c.slug === CATEGORY_SLUG,
	);
	if (!category) {
		throw new Error(`Discussion category "${CATEGORY_SLUG}" not found on ${OWNER}/${REPO}`);
	}

	// Fetch every existing discussion in that category, paginating.
	const existing = new Map(); // title -> url
	let cursor = null;
	for (;;) {
		const page = gql(
			`query($owner: String!, $repo: String!, $categoryId: ID, $after: String) {
				repository(owner: $owner, name: $repo) {
					discussions(first: 50, categoryId: $categoryId, after: $after) {
						nodes { title url }
						pageInfo { hasNextPage endCursor }
					}
				}
			}`,
			{
				owner: OWNER,
				repo: REPO,
				categoryId: category.id,
				after: cursor,
			},
		);
		const conn = page.data.repository.discussions;
		for (const node of conn.nodes) existing.set(node.title, node.url);
		if (!conn.pageInfo.hasNextPage) break;
		cursor = conn.pageInfo.endCursor;
	}

	const links = {};
	for (const post of posts) {
		const found = existing.get(post.title);
		if (found) {
			links[post.slug] = found;
			continue;
		}
		console.log(`Creating discussion for "${post.title}"...`);
		const body = `Comments for [${post.title}](${SITE_URL}/blog/${post.slug}).\n\nReply below.`;
		const created = gql(
			`mutation($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
				createDiscussion(input: { repositoryId: $repositoryId, categoryId: $categoryId, title: $title, body: $body }) {
					discussion { url }
				}
			}`,
			{
				repositoryId,
				categoryId: category.id,
				title: post.title,
				body,
			},
		);
		links[post.slug] = created.data.createDiscussion.discussion.url;
	}

	mkdirSync(path.dirname(outFile), { recursive: true });
	writeFileSync(outFile, JSON.stringify(links, null, 2) + '\n');
	console.log(`Wrote ${Object.keys(links).length} discussion link(s) to ${path.relative(repoRoot, outFile)}`);
}

main();
