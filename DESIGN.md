# System Design Document

## 1. Caching Strategy

### How Cache Invalidation Works

The application uses a **cache-aside pattern** with Redis:

- **Project List Cache (`projects:user:{userId}`)**: Stores all projects for a user, TTL 5 minutes
- **Project Detail Cache (`project:{projectId}`)**: Stores project with all tasks, TTL 2 minutes

**Invalidation Rules:**
- When a project is created/deleted → invalidate user's project list cache
- When a project is updated → invalidate both project detail and user's project list
- When a task is created/updated/deleted → invalidate project detail cache and user's project list

**Synchronization Handling:**

If cache and database get out of sync:

1. **Short TTL:** Max staleness is 5 minutes before automatic refresh
2. **Explicit Invalidation:** All mutations invalidate relevant caches immediately
3. **Graceful Fallback:** If Redis is down, application queries database directly (no caching)
4. **Cache Version Keys:** Could implement versioning (e.g., `v1:project:{id}`) for schema changes

**Trade-offs:**
- Accepts eventual consistency (max 2-5 min stale)
- Prioritizes read performance over write consistency
- Redis failure doesn't break application (graceful degradation)

---

## 2. Failure Handling

### Export Job Failure Scenarios

**Midway Failure Handling:**

1. **Database Transaction Failure:**
   - Status remains `PROCESSING`
   - Worker catches error and updates to `FAILED`
   - Error logged for debugging

2. **File Write Failure:**
   - Partial files are not saved
   - Status updated to `FAILED`
   - User sees failure message in UI

3. **Worker Crash:**
   - Bull queue marks job as `stalled` after timeout
   - Job returns to queue for retry (up to 3 attempts)
   - Exponential backoff: 2s, 4s, 8s delays

**Retry Strategy Implemented:**

```typescript
{
  attempts: 3,  // Retry failed jobs up to 3 times
  backoff: {
    type: 'exponential',
    delay: 2000  // Start with 2s, doubles each retry
  }
}
```

**What Could Be Improved:**

- **Idempotency:** Track completed steps to resume from failure point
- **Cleanup:** Delete partial files on failure
- **Dead Letter Queue:** Move permanently failed jobs to separate queue for manual review
- **Notifications:** Email/webhook on export completion or failure
- **Partial Success:** Save what was processed before failure

**Current Behavior:**
- Without Redis: Exports process synchronously (no retries, but immediate feedback)
- With Redis: Background processing with automatic retries via Bull queue

---

## 3. Improvements with 4 More Hours

**Priority Enhancement: Real-time Updates with WebSockets**

### Why This Matters

Currently, users must refresh to see changes from other team members. This breaks collaboration flow.

### Implementation Plan (4 hours)

**Hour 1: Backend WebSocket Setup**
- Add Socket.IO to Express server
- Create event emitters for: project updates, task changes
- Implement room-based subscriptions (`project:{id}` rooms)

**Hour 2: Authentication & Authorization**
- Validate JWT on socket connection
- Ensure users only join rooms for projects they own
- Add middleware for socket authentication

**Hour 3: Frontend Integration**
- Add Socket.IO client
- Subscribe to project room on ProjectDetailPage mount
- Listen for events: `task:created`, `task:updated`, `task:deleted`
- Update React Query cache on incoming events (optimistic updates)

**Hour 4: Polish & Testing**
- Add connection status indicator
- Handle reconnection logic
- Add typing indicators for task editing
- Test with multiple browser windows

### Expected Outcome

- Users see updates in real-time without refresh
- Better collaboration for team projects
- Reduced API calls (no polling needed)
- Enhanced user experience

### Alternative Improvements Considered

1. **Task Comments/Activity Log** - Better for communication but less impactful
2. **Drag-and-Drop Kanban Board** - Great UX but complex with real-time sync
3. **Advanced Filtering & Search** - Useful for large datasets but not needed yet
4. **Email Notifications** - Good for async work but requires email service setup

**Conclusion:** Real-time updates provide the most value for collaborative work and demonstrate advanced full-stack skills (WebSockets, event-driven architecture).
