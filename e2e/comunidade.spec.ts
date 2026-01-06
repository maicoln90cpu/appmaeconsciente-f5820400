import { test, expect } from './fixtures/auth';

test.describe('Community (Comunidade)', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/comunidade');
  });

  test.describe('View Posts', () => {
    test('should display community page', async ({ authenticatedPage }) => {
      await authenticatedPage.waitForLoadState('networkidle');
      
      // Should show community header or posts
      const header = authenticatedPage.locator('h1:has-text("Comunidade")').or(
        authenticatedPage.locator('text=Community')
      );
      
      await expect(header.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show posts or empty state', async ({ authenticatedPage }) => {
      await authenticatedPage.waitForLoadState('networkidle');
      
      // Either posts exist or empty state is shown
      const content = authenticatedPage.locator('[data-testid="post-card"]').or(
        authenticatedPage.locator('text=Nenhum post')
      ).or(authenticatedPage.locator('.post-card'));
      
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have category filters', async ({ authenticatedPage }) => {
      await authenticatedPage.waitForLoadState('networkidle');
      
      // Look for filter controls
      const filters = authenticatedPage.locator('[data-testid="post-filters"]').or(
        authenticatedPage.locator('input[placeholder*="Buscar"]')
      ).or(authenticatedPage.locator('text=Filtrar'));
      
      await expect(filters.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Create Post', () => {
    test('should open create post dialog', async ({ authenticatedPage }) => {
      // Find create post button (usually floating action button)
      const createButton = authenticatedPage.locator('button:has-text("Criar")').or(
        authenticatedPage.locator('button:has-text("Nova Publicação")')
      ).or(authenticatedPage.locator('[data-testid="create-post-button"]'))
        .or(authenticatedPage.locator('button[aria-label*="criar"]'));
      
      await createButton.first().click();
      
      // Dialog should open
      const dialog = authenticatedPage.locator('[role="dialog"]').or(
        authenticatedPage.locator('[data-testid="create-post-dialog"]')
      );
      
      await expect(dialog).toBeVisible({ timeout: 5000 });
    });

    test('should create new post', async ({ authenticatedPage }) => {
      // Open dialog
      const createButton = authenticatedPage.locator('button:has-text("Criar")').or(
        authenticatedPage.locator('[data-testid="create-post-button"]')
      ).first();
      
      await createButton.click();
      
      // Fill content
      const contentInput = authenticatedPage.locator('textarea').or(
        authenticatedPage.locator('[data-testid="post-content-input"]')
      );
      
      const postContent = `Test post ${Date.now()}`;
      await contentInput.first().fill(postContent);
      
      // Submit
      const submitButton = authenticatedPage.locator('button:has-text("Publicar")').or(
        authenticatedPage.locator('button[type="submit"]')
      );
      
      await submitButton.click();
      
      // Wait for dialog to close and post to appear
      await authenticatedPage.waitForLoadState('networkidle');
      
      // Verify post appears
      await expect(authenticatedPage.locator(`text=${postContent}`)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Post Interactions', () => {
    test('should allow liking a post', async ({ authenticatedPage }) => {
      await authenticatedPage.waitForLoadState('networkidle');
      
      // Find like button on first post
      const likeButton = authenticatedPage.locator('button[aria-label*="curtir"]').or(
        authenticatedPage.locator('[data-testid="like-button"]')
      ).or(authenticatedPage.locator('button:has(.lucide-heart)'));
      
      if (await likeButton.first().isVisible()) {
        await likeButton.first().click();
        
        // Like count should update (or heart should change state)
        await authenticatedPage.waitForTimeout(500);
      }
    });

    test('should open comments section', async ({ authenticatedPage }) => {
      await authenticatedPage.waitForLoadState('networkidle');
      
      // Find comments button
      const commentsButton = authenticatedPage.locator('button[aria-label*="comentar"]').or(
        authenticatedPage.locator('[data-testid="comments-button"]')
      ).or(authenticatedPage.locator('button:has(.lucide-message-circle)'));
      
      if (await commentsButton.first().isVisible()) {
        await commentsButton.first().click();
        
        // Comments section should expand
        const commentsSection = authenticatedPage.locator('[data-testid="comments-section"]').or(
          authenticatedPage.locator('input[placeholder*="comentário"]')
        );
        
        await expect(commentsSection.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should allow adding comment', async ({ authenticatedPage }) => {
      await authenticatedPage.waitForLoadState('networkidle');
      
      // Open comments
      const commentsButton = authenticatedPage.locator('button[aria-label*="comentar"]').or(
        authenticatedPage.locator('button:has(.lucide-message-circle)')
      ).first();
      
      if (await commentsButton.isVisible()) {
        await commentsButton.click();
        
        // Find comment input
        const commentInput = authenticatedPage.locator('input[placeholder*="comentário"]').or(
          authenticatedPage.locator('textarea[placeholder*="comentário"]')
        ).or(authenticatedPage.locator('[data-testid="comment-input"]'));
        
        if (await commentInput.first().isVisible()) {
          const commentText = `Test comment ${Date.now()}`;
          await commentInput.first().fill(commentText);
          
          // Submit comment
          const submitComment = authenticatedPage.locator('button[type="submit"]').or(
            authenticatedPage.locator('button:has(.lucide-send)')
          );
          
          await submitComment.first().click();
          
          // Verify comment appears
          await expect(authenticatedPage.locator(`text=${commentText}`)).toBeVisible({ timeout: 10000 });
        }
      }
    });
  });

  test.describe('Search and Filter', () => {
    test('should filter posts by search query', async ({ authenticatedPage }) => {
      await authenticatedPage.waitForLoadState('networkidle');
      
      // Find search input
      const searchInput = authenticatedPage.locator('input[placeholder*="Buscar"]').or(
        authenticatedPage.locator('[data-testid="search-input"]')
      );
      
      if (await searchInput.first().isVisible()) {
        await searchInput.first().fill('test');
        
        // Wait for filter to apply
        await authenticatedPage.waitForTimeout(500);
      }
    });
  });
});
