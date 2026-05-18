import { defineCollection, z } from 'astro:content';

// 定义 blog 集合的数据结构
// z.string() = 必须是文字，z.date() = 必须是日期，.optional() = 可选
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { blog };
