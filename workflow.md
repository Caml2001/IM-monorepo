# Implementation Workflow - ConvexPo Image AI App

## Current Status ✅
- **Frontend**: React Native Expo app with navigation, UI components, and screens ready
- **Authentication**: Better-auth with Convex integration (email/password, OAuth ready)
- **Database**: Convex with basic user schema
- **UI/UX**: Complete with HeroUI components and local SVG icons

## Required Implementations 🚀

### Phase 1: Core Infrastructure Setup

#### 1.1 Environment Variables
```env
# .env.local (backend)
REPLICATE_API_TOKEN=r8_...
CLOUDFLARE_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=convexpo-images
R2_PUBLIC_URL=https://images.convexpo.app

# apps/native/.env
EXPO_PUBLIC_CONVEX_URL=https://...convex.cloud
```

#### 1.2 Install Dependencies
```bash
# Backend packages
cd packages/backend
pnpm add replicate @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Native app (if needed)
cd apps/native
pnpm add expo-file-system expo-sharing
```

### Phase 2: Convex Schema Extension

#### 2.1 Update `packages/backend/convex/schema.ts`
```typescript
export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    credits: v.number(), // AI generation credits
    tier: v.string(), // "free" | "pro" | "premium"
  }),
  
  images: defineTable({
    userId: v.id("users"),
    prompt: v.string(),
    negativePrompt: v.optional(v.string()),
    imageUrl: v.string(), // R2 URL
    thumbnailUrl: v.optional(v.string()),
    model: v.string(), // "flux", "sdxl", etc.
    type: v.string(), // "generated", "edited", "upscaled", "bg-removed"
    metadata: v.optional(v.object({
      seed: v.optional(v.number()),
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      steps: v.optional(v.number()),
      originalImageUrl: v.optional(v.string()),
    })),
    status: v.string(), // "pending", "processing", "completed", "failed"
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"]),
  
  collections: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    coverImageId: v.optional(v.id("images")),
    isPublic: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
  
  collectionImages: defineTable({
    collectionId: v.id("collections"),
    imageId: v.id("images"),
    order: v.number(),
  }).index("by_collection", ["collectionId"])
    .index("by_image", ["imageId"]),
  
  trending: defineTable({
    imageId: v.id("images"),
    score: v.number(), // popularity score
    views: v.number(),
    likes: v.number(),
    shares: v.number(),
    date: v.string(), // "2024-01-15" for daily trending
  }).index("by_date_score", ["date", "score"]),
});
```

### Phase 3: Backend Implementation

#### 3.1 Create `packages/backend/convex/lib/replicate.ts`
```typescript
// Replicate client configuration and model mappings
const MODELS = {
  generate: "black-forest-labs/flux-1.1-pro",
  generateFast: "stability-ai/sdxl-turbo",
  removeBackground: "cjwbw/rembg",
  upscale: "nightmareai/real-esrgan",
  edit: "timothybrooks/instruct-pix2pix",
};
```

#### 3.2 Create `packages/backend/convex/lib/r2.ts`
```typescript
// R2/S3 client for image storage
// Upload, delete, and generate signed URLs
```

#### 3.3 Create `packages/backend/convex/replicate.ts`
```typescript
// Convex actions for Replicate API calls
export const generateImage = action({...});
export const removeBackground = action({...});
export const upscaleImage = action({...});
export const editImage = action({...});
```

#### 3.4 Create `packages/backend/convex/images.ts`
```typescript
// Mutations and queries for images
export const create = mutation({...});
export const list = query({...});
export const getById = query({...});
export const deleteImage = mutation({...});
export const updateStatus = internalMutation({...});
```

#### 3.5 Create `packages/backend/convex/collections.ts`
```typescript
// User collections management
export const create = mutation({...});
export const addImage = mutation({...});
export const removeImage = mutation({...});
export const list = query({...});
```

#### 3.6 Create `packages/backend/convex/trending.ts`
```typescript
// Trending images logic
export const getTrending = query({...});
export const incrementView = mutation({...});
export const likeImage = mutation({...});
```

### Phase 4: Frontend Integration

#### 4.1 Create API hooks in `apps/native/lib/`
```typescript
// hooks/useImages.ts
// hooks/useGeneration.ts
// hooks/useCollections.ts
```

#### 4.2 Update screens to use real data
- Connect `create.tsx` to generation API
- Connect `edit.tsx` to edit/background removal APIs
- Connect `scale.tsx` to upscale API
- Connect `library.tsx` to user images
- Connect `trends.tsx` to trending API
- Connect `viewer.tsx` to image details

### Phase 5: Features Implementation

#### 5.1 Core Features
- [ ] Image generation with prompts
- [ ] Background removal
- [ ] Image upscaling (2x, 4x)
- [ ] Image editing with prompts
- [ ] Save to library
- [ ] Collections/Albums
- [ ] Share functionality
- [ ] Download to device

#### 5.2 Advanced Features
- [ ] Credit system
- [ ] Generation history
- [ ] Favorite images
- [ ] Public/private collections
- [ ] Trending algorithm
- [ ] Search in library
- [ ] Batch operations
- [ ] Templates/Presets

### Phase 6: Optimization & Polish

#### 6.1 Performance
- [ ] Image caching with Expo FileSystem
- [ ] Lazy loading for galleries
- [ ] Optimistic updates
- [ ] Background job processing
- [ ] CDN integration for R2

#### 6.2 User Experience
- [ ] Loading states with skeletons
- [ ] Error handling & retry logic
- [ ] Progress indicators for generation
- [ ] Push notifications for completed jobs
- [ ] Onboarding flow

### Phase 7: Monitoring & Analytics

#### 7.1 Setup
- [ ] Error tracking (Sentry)
- [ ] Analytics (Posthog/Mixpanel)
- [ ] Performance monitoring
- [ ] Usage metrics

## API Endpoints Structure

### Convex Functions Map
```
images/
  ├── generateImage (action) - Call Replicate for generation
  ├── removeBackground (action) - Background removal
  ├── upscaleImage (action) - Upscale 2x/4x
  ├── editImage (action) - Edit with prompt
  ├── create (mutation) - Save image metadata
  ├── list (query) - Get user images
  ├── getById (query) - Get single image
  └── delete (mutation) - Delete image

collections/
  ├── create (mutation)
  ├── update (mutation)
  ├── delete (mutation)
  ├── list (query)
  ├── getById (query)
  ├── addImage (mutation)
  └── removeImage (mutation)

trending/
  ├── getTrending (query)
  ├── incrementView (mutation)
  └── likeImage (mutation)

users/
  ├── getProfile (query)
  ├── updateProfile (mutation)
  ├── getCredits (query)
  └── addCredits (mutation)
```

## Model Selection Strategy

### For Different Use Cases:
- **Quick Generation**: SDXL Turbo (fast, lower quality)
- **High Quality**: Flux 1.1 Pro (slower, best quality)
- **Anime/Cartoon**: Specialized models
- **Photorealistic**: Flux or SDXL with photo prompts
- **Background Removal**: rembg (fast and accurate)
- **Upscaling**: Real-ESRGAN (best for photos)

## Cost Optimization

1. **Caching Strategy**
   - Cache generated images in R2
   - Use CDN for frequently accessed images
   - Local cache on device with Expo FileSystem

2. **Credit System**
   - Free tier: 10 generations/day
   - Pro: 100 generations/day
   - Premium: Unlimited

3. **Model Selection**
   - Use cheaper models for previews
   - Premium models for final renders
   - Batch similar requests

## Security Considerations

1. **API Keys**: Store in Convex environment variables
2. **Rate Limiting**: Implement per-user limits
3. **Input Validation**: Sanitize prompts and check for inappropriate content
4. **File Validation**: Verify image uploads before processing
5. **Access Control**: Ensure users can only access their own images

## Testing Strategy

1. **Unit Tests**: Convex functions
2. **Integration Tests**: API endpoints
3. **E2E Tests**: Critical user flows
4. **Performance Tests**: Image generation pipeline

## Deployment Checklist

- [ ] Environment variables configured
- [ ] R2 bucket created and configured
- [ ] Replicate API key added
- [ ] Convex deployment updated
- [ ] Error tracking enabled
- [ ] Analytics configured
- [ ] CDN setup for R2
- [ ] Rate limiting configured
- [ ] Monitoring dashboards created

## Next Steps

1. **Immediate**: Set up R2 bucket and Replicate API key
2. **Day 1**: Implement core generation functionality
3. **Day 2-3**: Add edit, upscale, and background removal
4. **Day 4-5**: Implement collections and library
5. **Week 2**: Polish, optimize, and add advanced features

## Resources

- [Replicate Models](https://replicate.com/explore)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Convex Actions](https://docs.convex.dev/functions/actions)
- [Expo File System](https://docs.expo.dev/versions/latest/sdk/filesystem/)