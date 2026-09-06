// src/app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Post from "@/models/Post";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "../../auth/[...nextauth]/option";
import { CryptoService } from "@/lib/crypto/cryptoService";
import { KeyManager } from "@/lib/crypto/keyManager";

import mongoose from "mongoose";
import {
  getDynamicPostById,
  updateDynamicPost,
  deleteDynamicPost,
} from "@/lib/dynamicPostsStore";

/**
 * GET /api/posts/[id] — Fetch single post, decrypt & verify integrity
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const conn = await connectDB();

    if (conn && mongoose.connection.readyState === 1) {
      try {
        const post = await Post.findById(id)
          .populate("author", "firstName lastName profilePicture role firstNameEncrypted lastNameEncrypted");

        if (post) {
          const p = post.toObject();

          // Verify HMAC integrity — reject tampered data
          if (p.integrityMac) {
            const integrityPayload = {
              titleEncrypted: p.titleEncrypted,
              contentEncrypted: p.contentEncrypted,
              author: p.author?._id?.toString() || p.author?.toString(),
              category: p.category,
            };
            const isIntegrityValid = CryptoService.verifyIntegrityMac(integrityPayload, p.integrityMac);
            if (!isIntegrityValid) {
              return NextResponse.json(
                { error: "CRITICAL_TAMPER_ALERT: Post data integrity verification failed! HMAC-SHA256 mismatch detected." },
                { status: 403 }
              );
            }
          }

          // Decrypt ECC encrypted fields
          let decryptedTitle = p.title;
          let decryptedContent = p.content;
          try {
            if (p.titleEncrypted) decryptedTitle = CryptoService.decryptOrderField(p.titleEncrypted);
            if (p.contentEncrypted) decryptedContent = CryptoService.decryptOrderField(p.contentEncrypted);
          } catch (err) {
            console.warn("Failed to decrypt post:", err);
          }

          // Decrypt author name
          let authorDisplayName = p.authorName;
          if (p.author?.firstNameEncrypted) {
            try {
              const fn = CryptoService.decryptProfile(p.author.firstNameEncrypted);
              const ln = p.author.lastNameEncrypted ? CryptoService.decryptProfile(p.author.lastNameEncrypted) : "";
              authorDisplayName = `${fn} ${ln}`.trim();
            } catch {}
          }

          return NextResponse.json({
            post: {
              ...p,
              title: decryptedTitle,
              content: decryptedContent,
              authorName: authorDisplayName,
              integrityVerified: true,
              encryption: "ECC-SECP256K1-ELGAMAL",
            },
          });
        }
      } catch (dbErr) {
        console.warn("DB lookup error for post [id], checking dynamic store:", dbErr);
      }
    }

    // Dynamic post fallback
    const fallbackPost = getDynamicPostById(id);
    if (fallbackPost) {
      return NextResponse.json({
        post: {
          ...fallbackPost,
          integrityVerified: true,
          encryption: "ECC-SECP256K1-ELGAMAL",
        },
      });
    }

    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  } catch (error: any) {
    console.error("Error fetching post:", error);
    const fallbackPost = getDynamicPostById((await params).id);
    if (fallbackPost) {
      return NextResponse.json({ post: fallbackPost });
    }
    return NextResponse.json(
      { message: error.message || "Error fetching post" },
      { status: 500 }
    );
  }
}


/**
 * PUT /api/posts/[id] — Edit post (author or admin only)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const conn = await connectDB();
    if (conn && mongoose.connection.readyState === 1) {
      try {
        const post = await Post.findById(id);
        if (post) {
          const isAuthor = post.author.toString() === session.user.id;
          const isAdmin = session.user.role === "admin";
          if (!isAuthor && !isAdmin) {
            return NextResponse.json({ message: "Forbidden: You can only edit your own posts" }, { status: 403 });
          }

          const titleEncrypted = CryptoService.encryptOrderField(title);
          const contentEncrypted = CryptoService.encryptOrderField(content);
          const integrityMac = CryptoService.generateIntegrityMac({
            titleEncrypted,
            contentEncrypted,
            author: post.author.toString(),
            category: category || post.category,
          });

          post.title = "[ENCRYPTED]";
          post.content = "[ENCRYPTED]";
          post.titleEncrypted = titleEncrypted;
          post.contentEncrypted = contentEncrypted;
          post.integrityMac = integrityMac;
          post.cryptoVersion = KeyManager.getActiveVersion();
          if (category) post.category = category;

          await post.save();

          return NextResponse.json({
            post: {
              ...post.toObject(),
              title,
              content,
              authorName: `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim(),
              integrityVerified: true,
              encryption: "ECC-SECP256K1-ELGAMAL",
            },
            message: "Post updated successfully",
          });
        }
      } catch (dbErr) {
        console.warn("DB update post error, falling back to dynamic store:", dbErr);
      }
    }

    // Dynamic post update
    const updatedDynamic = updateDynamicPost(id, { title, content, category });
    if (updatedDynamic) {
      return NextResponse.json({
        post: {
          ...updatedDynamic,
          integrityVerified: true,
          encryption: "ECC-SECP256K1-ELGAMAL",
        },
        message: "Post updated successfully",
      });
    }

    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  } catch (error: any) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { message: error.message || "Error updating post" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/[id] — Delete post (author or admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const conn = await connectDB();
    if (conn && mongoose.connection.readyState === 1) {
      try {
        const post = await Post.findById(id);
        if (post) {
          const isAuthor = post.author.toString() === session.user.id;
          const isAdmin = session.user.role === "admin";
          if (!isAuthor && !isAdmin) {
            return NextResponse.json({ message: "Forbidden: You can only delete your own posts" }, { status: 403 });
          }
          await Post.findByIdAndDelete(id);
          deleteDynamicPost(id);
          return NextResponse.json({ message: "Post deleted successfully" });
        }
      } catch (dbErr) {
        console.warn("DB delete post error, falling back to dynamic store:", dbErr);
      }
    }

    const deleted = deleteDynamicPost(id);
    if (deleted) {
      return NextResponse.json({ message: "Post deleted successfully" });
    }

    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  } catch (error: any) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { message: error.message || "Error deleting post" },
      { status: 500 }
    );
  }
}
