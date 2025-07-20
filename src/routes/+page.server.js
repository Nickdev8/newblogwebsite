import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export async function load() {
  const postsDir = 'src/posts';
  const files = fs.readdirSync(postsDir);

  const posts = files
    .map((filename) => {
      const filePath = path.join(postsDir, filename);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(fileContent);

      const slug = filename.replace(/\.md$/, '');

      if (data.date && data.title) {
        return {
          title: data.title,
          date: data.date,
          slug,
          content
        };
      }
      return null;
    })
    .filter((post) => post !== null);

  posts.sort((a, b) => b.date.localeCompare(a.date));

  return { posts };
}