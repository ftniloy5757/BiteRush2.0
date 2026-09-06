import { DEMO_IDS } from "./demoData";
import { CryptoService } from "./crypto/cryptoService";
import { KeyManager } from "./crypto/keyManager";

export interface DynamicPost {
  _id: string;
  title: string;
  content: string;
  titleEncrypted: string;
  contentEncrypted: string;
  category: "Food Review" | "Restaurant Recommendation" | "Diet & Recipes" | "General Discussion";
  author: any;
  authorName: string;
  likes: number;
  cryptoVersion: number;
  integrityMac: string;
  createdAt: string;
  updatedAt: string;
}

// Generate consistent ciphertexts and matching HMAC tags for initial seed posts
const burgerTitleEnc = CryptoService.encryptOrderField("Best Burgers in Dhaka!");
const burgerContentEnc = CryptoService.encryptOrderField("The Flame-Grilled Beef Burger from BiteRush is genuinely out of this world. Super juicy patty and perfectly toasted brioche buns!");
const burgerMac = CryptoService.generateIntegrityMac({
  titleEncrypted: burgerTitleEnc,
  contentEncrypted: burgerContentEnc,
  author: DEMO_IDS.CUSTOMER,
  category: "Food Review",
});

const pastaTitleEnc = CryptoService.encryptOrderField("Pasta Review");
const pastaContentEnc = CryptoService.encryptOrderField("The pasta tasted good but the appetizers provided along with the pasta was not upto the mark. Overall taste was above average.");
const pastaMac = CryptoService.generateIntegrityMac({
  titleEncrypted: pastaTitleEnc,
  contentEncrypted: pastaContentEnc,
  author: "65f300000000000000000099",
  category: "Food Review",
});

const healthyTitleEnc = CryptoService.encryptOrderField("Healthy Low-Calorie Pasta Option");
const healthyContentEnc = CryptoService.encryptOrderField("Asked chef for lighter olive oil drizzle and whole wheat option. Absolutely loved it! High protein and delicious.");
const healthyMac = CryptoService.generateIntegrityMac({
  titleEncrypted: healthyTitleEnc,
  contentEncrypted: healthyContentEnc,
  author: DEMO_IDS.CUSTOMER,
  category: "Diet & Recipes",
});

const INITIAL_POSTS: DynamicPost[] = [
  {
    _id: "65f300000000000000000001",
    title: "Best Burgers in Dhaka!",
    content: "The Flame-Grilled Beef Burger from BiteRush is genuinely out of this world. Super juicy patty and perfectly toasted brioche buns!",
    titleEncrypted: burgerTitleEnc,
    contentEncrypted: burgerContentEnc,
    category: "Food Review",
    author: {
      _id: DEMO_IDS.CUSTOMER,
      firstName: "Niloy",
      lastName: "Farhan",
      role: "customer",
    },
    authorName: "Niloy Farhan",
    likes: 12,
    cryptoVersion: 1,
    integrityMac: burgerMac,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    _id: "65f300000000000000000002",
    title: "Pasta Review",
    content: "The pasta tasted good but the appetizers provided along with the pasta was not upto the mark. Overall taste was above average.",
    titleEncrypted: pastaTitleEnc,
    contentEncrypted: pastaContentEnc,
    category: "Food Review",
    author: {
      _id: "65f300000000000000000099",
      firstName: "Fardin",
      lastName: "Khan",
      role: "customer",
    },
    authorName: "Fardin Khan",
    likes: 8,
    cryptoVersion: 1,
    integrityMac: pastaMac,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    _id: "65f300000000000000000003",
    title: "Healthy Low-Calorie Pasta Option",
    content: "Asked chef for lighter olive oil drizzle and whole wheat option. Absolutely loved it! High protein and delicious.",
    titleEncrypted: healthyTitleEnc,
    contentEncrypted: healthyContentEnc,
    category: "Diet & Recipes",
    author: {
      _id: DEMO_IDS.CUSTOMER,
      firstName: "Niloy",
      lastName: "Farhan",
      role: "customer",
    },
    authorName: "Niloy Farhan",
    likes: 7,
    cryptoVersion: 1,
    integrityMac: healthyMac,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

declare global {
  // eslint-disable-next-line no-var
  var dynamicPosts: DynamicPost[] | undefined;
}

if (!global.dynamicPosts) {
  global.dynamicPosts = [...INITIAL_POSTS];
}

export const getDynamicPosts = (category?: string): DynamicPost[] => {
  if (!global.dynamicPosts || global.dynamicPosts.length === 0) {
    global.dynamicPosts = [...INITIAL_POSTS];
  }
  let posts = [...global.dynamicPosts];
  if (category && category.toLowerCase() !== "all") {
    posts = posts.filter(
      (p) => p.category.toLowerCase().trim() === category.toLowerCase().trim()
    );
  }
  return posts;
};

export const getDynamicPostById = (id: string): DynamicPost | null => {
  const posts = getDynamicPosts();
  return posts.find((p) => p._id === id) || null;
};

export const addDynamicPost = (data: {
  title: string;
  content: string;
  category: any;
  authorId: string;
  authorName: string;
}): DynamicPost => {
  const hexTimestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  const randomHex = Math.floor(Math.random() * 0xffffffffffff).toString(16).padStart(16, "0");
  const generatedId = (hexTimestamp + randomHex).toLowerCase();

  const titleEncrypted = CryptoService.encryptOrderField(data.title);
  const contentEncrypted = CryptoService.encryptOrderField(data.content);

  const integrityMac = CryptoService.generateIntegrityMac({
    titleEncrypted,
    contentEncrypted,
    author: data.authorId,
    category: data.category || "General Discussion",
  });

  const newPost: DynamicPost = {
    _id: generatedId,
    title: data.title,
    content: data.content,
    titleEncrypted,
    contentEncrypted,
    category: data.category || "General Discussion",
    author: {
      _id: data.authorId,
      firstName: data.authorName.split(" ")[0] || "User",
      lastName: data.authorName.split(" ").slice(1).join(" ") || "",
      role: "customer",
    },
    authorName: data.authorName,
    likes: 0,
    cryptoVersion: KeyManager.getActiveVersion(),
    integrityMac,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!global.dynamicPosts) {
    global.dynamicPosts = [...INITIAL_POSTS];
  }
  global.dynamicPosts = [newPost, ...global.dynamicPosts];
  return newPost;
};

export const updateDynamicPost = (
  id: string,
  updates: { title: string; content: string; category?: string }
): DynamicPost | null => {
  const posts = getDynamicPosts();
  const postIndex = posts.findIndex((p) => p._id === id);
  if (postIndex === -1) return null;

  const titleEncrypted = CryptoService.encryptOrderField(updates.title);
  const contentEncrypted = CryptoService.encryptOrderField(updates.content);
  const post = posts[postIndex];

  const integrityMac = CryptoService.generateIntegrityMac({
    titleEncrypted,
    contentEncrypted,
    author: post.author?._id || post.author,
    category: updates.category || post.category,
  });

  post.title = updates.title;
  post.content = updates.content;
  post.titleEncrypted = titleEncrypted;
  post.contentEncrypted = contentEncrypted;
  if (updates.category) post.category = updates.category as any;
  post.integrityMac = integrityMac;
  post.updatedAt = new Date().toISOString();

  global.dynamicPosts = posts;
  return post;
};

export const deleteDynamicPost = (id: string): boolean => {
  const posts = getDynamicPosts();
  const initialLen = posts.length;
  global.dynamicPosts = posts.filter((p) => p._id !== id);
  return global.dynamicPosts.length < initialLen;
};
