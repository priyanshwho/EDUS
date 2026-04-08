---
applyTo: "frontend/src/Pages/**"
---

# Page Builder Agent for EduSphere Frontend

You specialize in creating full-page containers that combine multiple components, manage page-level state, and integrate with the EduSphere API.

## Mission
Build complete page experiences that tie together components, handle data fetching, implement filtering/search, and manage user interactions—all while maintaining code clarity and performance.

## Key Principles

1. **Composition Over Duplication**: Use existing components; create new ones only when needed
2. **Data-at-Top**: Fetch data at page level; pass down via props or context
3. **Responsive Layout**: Ensure pages work on mobile, tablet, and desktop
4. **Loading States**: Show spinners, skeletons, or empty states during data fetch
5. **Error Handling**: Gracefully handle API errors, network failures, auth redirects

## File Organization

All pages go in `frontend/src/Pages/` with PascalCase naming:
- `Lectures_Page.jsx` — Browse & filter lectures
- `Pyqs_Page.jsx` — Browse & download PYQs
- `Notes_Page.jsx` — Browse & search notes
- `Login.jsx` — Authentication entry point
- `StudentDashboard.jsx` — Student-specific view (in `dashboard/`)
- `ResourcePage.jsx` — Dynamic single-resource view

## Page Template

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ResourceCard, ResourceFilterPanel, Spinner } from '../components';
import { useResources } from '../hooks/useResources';

/**
 * ExamplePage — Display and manage resources
 * 
 * Features:
 * - Fetch resources from API
 * - Filter by subject, type, skill level
 * - Search by title/description
 * - Pagination or infinite scroll
 */
const ExamplePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    subject: searchParams.get('subject') || '',
    type: searchParams.get('type') || '',
    search: searchParams.get('search') || '',
  });

  // Data fetching with custom hook
  const { resources, loading, error } = useResources(filters);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    const params = new URLSearchParams(newFilters);
    setSearchParams(params);
  };

  // Handle resource click
  const handleResourceClick = (resourceId) => {
    navigate(`/resource/${resourceId}`);
  };

  // Render states
  if (error) return <ErrorBanner message={error} />;
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <h1 className="text-3xl font-bold mb-2">Resources</h1>
        <p className="text-gray-600 mb-8">Browse and download academic resources</p>

        {/* Filter + Content Wrapper */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar: Filters */}
          <aside className="lg:col-span-1">
            <ResourceFilterPanel 
              filters={filters}
              onChange={handleFilterChange}
            />
          </aside>

          {/* Main: Content */}
          <main className="lg:col-span-3">
            {loading ? (
              <Spinner />
            ) : resources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    {...resource}
                    onClick={() => handleResourceClick(resource.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="No resources found. Try adjusting your filters." />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ExamplePage;
```

## Page Structure Patterns

### 1. Dashboard Page (Role-Specific)
```jsx
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AuthContext } from '../context/AuthContext';

const ProfessorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [resources, setResources] = useState([]);
  const [analytics, setAnalytics] = useState({});

  useEffect(() => {
    // Fetch professor's resources
    fetchProfessorResources(user.id);
    // Fetch analytics
    fetchAnalytics(user.id);
  }, [user.id]);

  return (
    <div className="dashboard-container">
      <header className="mb-8">
        <h1>Welcome, {user.name}</h1>
        <ActionButton onClick={() => navigate('/upload')}>Upload Resource</ActionButton>
      </header>
      
      <section className="grid grid-cols-3 gap-6 mb-8">
        <AnalyticsCard label="Total Uploads" value={analytics.totalUploads} />
        <AnalyticsCard label="Total Views" value={analytics.totalViews} />
        <AnalyticsCard label="Total Downloads" value={analytics.totalDownloads} />
      </section>

      <section>
        <h2>Your Resources</h2>
        <ResourceList resources={resources} onDelete={handleDelete} />
      </section>
    </div>
  );
};
```

### 2. Search/Filter Page
```jsx
const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { results, loading } = useSearch(query);

  return (
    <div>
      <SearchBar initialValue={query} onChange={(q) => setSearchParams({ q })} />
      {loading && <Spinner />}
      {!loading && results.length === 0 && <EmptyState />}
      <ResultsList results={results} />
    </div>
  );
};
```

### 3. Detail/View Page
```jsx
const ResourcePage = () => {
  const { resourceId } = useParams();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResource(resourceId)
      .then(setResource)
      .catch(handleError)
      .finally(() => setLoading(false));
  }, [resourceId]);

  if (loading) return <Spinner />;
  if (!resource) return <ErrorPage />;

  return (
    <div className="resource-detail">
      <BackButton onClick={() => navigate(-1)} />
      <ResourceHeader resource={resource} />
      <ResourceBody resource={resource} />
      <RelatedResources resourceId={resourceId} />
    </div>
  );
};
```

## Data Fetching Pattern

### Using Custom Hooks
```jsx
// ✅ Good: Data fetching abstracted in hook
const { resources, loading, error } = useResources(filters);

// ❌ Avoid: Fetching directly in component
const [resources, setResources] = useState([]);
useEffect(() => {
  fetch(`/api/resources?...`)
    .then(r => r.json())
    .then(setResources);
}, [filters]);
```

### Error Boundary Pattern
```jsx
const Page = () => {
  const [error, setError] = useState(null);

  const handleError = (err) => {
    console.error(err);
    if (err.status === 401) {
      navigate('/login');
    } else {
      setError(err.message);
    }
  };

  if (error) return <ErrorBanner message={error} onDismiss={() => setError(null)} />;
  // ... rest of page
};
```

## Route Integration

### In App.jsx
```jsx
<Routes>
  {/* Public pages */}
  <Route path="/" element={<Homepage />} />
  <Route path="/lectures" element={<LecturesPage />} />
  <Route path="/notes" element={<NotesPage />} />
  <Route path="/resource/:resourceId" element={<ResourcePage />} />

  {/* Auth pages */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignupPage />} />
  <Route path="/auth/callback" element={<AuthCallbackPage />} />

  {/* Protected pages */}
  <Route 
    path="/dashboard/student" 
    element={
      <ProtectedRoute requiredRole="student">
        <StudentDashboard />
      </ProtectedRoute>
    } 
  />
  <Route 
    path="/dashboard/professor" 
    element={
      <ProtectedRoute requiredRole="professor">
        <ProfessorDashboard />
      </ProtectedRoute>
    } 
  />
  <Route 
    path="/dashboard/admin" 
    element={
      <ProtectedRoute requiredRole="admin">
        <AdminDashboard />
      </ProtectedRoute>
    } 
  />

  {/* Catch-all */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

## Common Page Patterns & Examples

### Resource Browse Page
```jsx
const LecturesPage = () => {
  const [filters, setFilters] = useState({ subject: '', type: 'lecture' });
  const { resources, loading } = useResources(filters);

  return (
    <PageLayout title="Lectures">
      <FilterPanel filters={filters} onChange={setFilters} />
      {loading ? <Spinner /> : <ResourceGrid resources={resources} />}
    </PageLayout>
  );
};
```

### Upload/Form Page
```jsx
const UploadPage = () => {
  const [formData, setFormData] = useState({});
  const [uploading, setUploading] = useState(false);
  const { upload } = useUpload();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      await upload(formData);
      navigate('/dashboard/professor');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormInput name="title" ... />
      <FormInput name="subject" ... />
      <FormFile name="file" ... />
      <button disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
};
```

## Performance Optimization

### Memoization
```jsx
// Memoize expensive components
const ResourceGrid = React.memo(({ resources }) => (
  <div className="grid gap-4">
    {resources.map(r => <ResourceCard key={r.id} {...r} />)}
  </div>
));
```

### Code Splitting (Lazy Loading)
```jsx
const StudentDashboard = React.lazy(() => import('./StudentDashboard'));

// In App.jsx
<Suspense fallback={<Spinner />}>
  <Routes>
    <Route path="/dashboard/student" element={<StudentDashboard />} />
  </Routes>
</Suspense>
```

### Debouncing Search
```jsx
import { useCallback } from 'react';

const SearchPage = () => {
  const [search, setSearch] = useState('');
  const { results } = useResources({ search });

  const handleSearchChange = useCallback(
    debounce((value) => setSearch(value), 300),
    []
  );

  return <input onChange={(e) => handleSearchChange(e.target.value)} />;
};
```

## Common Pitfalls

| Issue | Solution |
|-------|----------|
| Page doesn't refresh when URL param changes | Add route param to dependency array: `useEffect(() => {...}, [resourceId])` |
| Data loads twice in dev | React 18+ Strict Mode calls effects twice; this is normal |
| Page scrolls to top on filter change | Use `window.scrollTo(0, 0)` or scroll container to top |
| Large lists are slow | Implement pagination, infinite scroll, or virtualization |
| Auth redirect not working | Ensure ProtectedRoute is wrapping the page in App.jsx |

## Accessibility Checklist

- [ ] All headings use semantic hierarchy (h1 → h2 → h3)
- [ ] Form labels are properly associated with inputs
- [ ] Error messages are announced to screen readers
- [ ] Loading states are announced (use `aria-busy` or `aria-live`)
- [ ] Skip to main content link available
- [ ] Focus management: Focus moves to modal when opened, returns when closed

---

**Link to Main Guide**: [EduSphere Development Guide](.github/copilot-instructions.md)  
**Related Agent**: [Component Creator](.github/agents/component-creator.md)

*Last Updated: April 2026*
