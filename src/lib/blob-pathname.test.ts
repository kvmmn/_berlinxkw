import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canonicalBlobPathname,
  classifyBlobPathname,
  isBlobStorePathname,
  isInstagramVideoClientUploadPathname,
  isPublicShopMediaPathname,
  resolvePathUnderRoot,
} from "./blob-pathname";

describe("blob-pathname", () => {
  describe("isPublicShopMediaPathname", () => {
    it("allows instagram media keys", () => {
      assert.equal(
        isPublicShopMediaPathname(
          "berlinxkw/instagram/a1b2c3d4-e5f6-7890-abcd-ef1234567890/photo.jpg",
        ),
        true,
      );
      assert.equal(
        isPublicShopMediaPathname("berlinxkw/instagram/demo/publish-sample.jpg"),
        true,
      );
    });

    it("allows tablo image keys including framed slots", () => {
      assert.equal(
        isPublicShopMediaPathname(
          "berlinxkw/tablos/tablo-8c0b8c6f-0000-4000-8000-000000000001/framed/bronze/sunset-v4.jpg",
        ),
        true,
      );
      assert.equal(
        isPublicShopMediaPathname("berlinxkw/tablos/my-slug/artwork/cover.png"),
        true,
      );
    });

    it("rejects path traversal via dot segments", () => {
      const evil =
        "berlinxkw/instagram/../tablos/tablo-8c0b8c6f/framed/photo.jpg";
      assert.equal(isPublicShopMediaPathname(evil), false);
      assert.equal(classifyBlobPathname(evil), "traversal");
    });

    it("rejects encoded dot segments in the query-decoded pathname", () => {
      const encoded = "berlinxkw/instagram/%2e%2e/tablos/x.jpg";
      assert.equal(isPublicShopMediaPathname(encoded), false);
      assert.equal(classifyBlobPathname(encoded), "traversal");
    });

    it("rejects backslashes and absolute paths", () => {
      assert.equal(isPublicShopMediaPathname("berlinxkw/instagram/foo\\..\\system/x.jpg"), false);
      assert.equal(isPublicShopMediaPathname("/berlinxkw/instagram/x.jpg"), false);
    });

    it("rejects sensitive prefixes without traversal", () => {
      assert.equal(isPublicShopMediaPathname("berlinxkw/system/instagram-token.json"), false);
      assert.equal(isPublicShopMediaPathname("berlinxkw/store.json"), false);
      assert.equal(isPublicShopMediaPathname("berlinxkw/ideas/abc/file.png"), false);
    });

    it("rejects empty and double-slash segments", () => {
      assert.equal(isPublicShopMediaPathname(""), false);
      assert.equal(isPublicShopMediaPathname("berlinxkw/instagram//x.jpg"), false);
    });
  });

  describe("canonicalBlobPathname", () => {
    it("returns unchanged path for valid keys", () => {
      const p = "berlinxkw/instagram/uuid/file.jpg";
      assert.equal(canonicalBlobPathname(p), p);
    });

    it("rejects normalization that would change the path", () => {
      assert.equal(canonicalBlobPathname("berlinxkw/instagram/./x.jpg"), null);
    });
  });

  describe("isInstagramVideoClientUploadPathname", () => {
    it("allows uuid folder mp4 uploads", () => {
      assert.equal(
        isInstagramVideoClientUploadPathname(
          "berlinxkw/instagram/a1b2c3d4-e5f6-4789-abcd-ef1234567890/reel.mp4",
        ),
        true,
      );
    });

    it("rejects traversal and non-mp4", () => {
      assert.equal(
        isInstagramVideoClientUploadPathname(
          "berlinxkw/instagram/../system/x.mp4",
        ),
        false,
      );
      assert.equal(
        isInstagramVideoClientUploadPathname(
          "berlinxkw/instagram/a1b2c3d4-e5f6-7890-abcd-ef1234567890/photo.jpg",
        ),
        false,
      );
    });
  });

  describe("resolvePathUnderRoot", () => {
    it("resolves safe relative paths", () => {
      const root = "/tmp/instagram-uploads";
      const resolved = resolvePathUnderRoot(root, "uuid/clip.mp4");
      assert.equal(resolved, "/tmp/instagram-uploads/uuid/clip.mp4");
    });

    it("rejects escape attempts", () => {
      const root = "/tmp/instagram-uploads";
      assert.equal(resolvePathUnderRoot(root, "../etc/passwd"), null);
      assert.equal(resolvePathUnderRoot(root, "uuid/../../secret"), null);
    });
  });

  describe("isBlobStorePathname", () => {
    it("allows portal blob keys under berlinxkw/", () => {
      assert.equal(isBlobStorePathname("berlinxkw/ideas/abc/ref.png"), true);
    });

    it("rejects traversal under berlinxkw prefix", () => {
      assert.equal(isBlobStorePathname("berlinxkw/instagram/../store.json"), false);
    });
  });
});
