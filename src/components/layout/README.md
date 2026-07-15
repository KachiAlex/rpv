# Screen Wrap Components

A collection of layout wrapper components that provide consistent responsive behavior and spacing throughout the application.

## Components

### ScreenWrap
The main container component that implements the layout optimization specifications.

```tsx
import { ScreenWrap } from '@/components/layout/screen-wrap';

// Default responsive container (90% width on desktop, max 1600px on ultra-wide)
<ScreenWrap>
  <YourContent />
</ScreenWrap>

// Different variants
<ScreenWrap variant="full">Full width</ScreenWrap>
<ScreenWrap variant="narrow">Narrow container (max-w-4xl)</ScreenWrap>
<ScreenWrap variant="wide">Wide container (max-w-7xl)</ScreenWrap>

// Different padding options
<ScreenWrap padding="none">No padding</ScreenWrap>
<ScreenWrap padding="sm">Small padding</ScreenWrap>
<ScreenWrap padding="lg">Large padding</ScreenWrap>
```

### PageWrap
Specialized wrapper for full page layouts with optional sidebar support.

```tsx
import { PageWrap } from '@/components/layout/screen-wrap';

// Standard page layout
<PageWrap>
  <YourPageContent />
</PageWrap>

// Page with sidebar (like the home page)
<PageWrap withSidebar>
  <aside>Sidebar content</aside>
  <main>Main content</main>
</PageWrap>
```

### ContentWrap
For main content areas with consistent vertical spacing.

```tsx
import { ContentWrap } from '@/components/layout/screen-wrap';

<ContentWrap spacing="default">
  <Section1 />
  <Section2 />
  <Section3 />
</ContentWrap>

// Different spacing options
<ContentWrap spacing="tight">Tight spacing (space-y-4)</ContentWrap>
<ContentWrap spacing="loose">Loose spacing (space-y-8 lg:space-y-10)</ContentWrap>
```

### CardWrap
Consistent card container with the app's design system.

```tsx
import { CardWrap } from '@/components/layout/screen-wrap';

// Default card
<CardWrap>
  <CardContent />
</CardWrap>

// Highlighted card (with brand border)
<CardWrap variant="highlighted">
  <ImportantContent />
</CardWrap>

// Interactive card with hover effects
<CardWrap interactive>
  <ClickableContent />
</CardWrap>
```

### GridWrap
Responsive grid container with consistent spacing.

```tsx
import { GridWrap } from '@/components/layout/screen-wrap';

// Auto-responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
<GridWrap>
  <GridItem1 />
  <GridItem2 />
  <GridItem3 />
</GridWrap>

// Fixed columns
<GridWrap columns="2">Always 2 columns on desktop</GridWrap>
<GridWrap columns="4">Up to 4 columns on xl screens</GridWrap>

// Different gap sizes
<GridWrap gap="sm">Small gaps</GridWrap>
<GridWrap gap="lg">Large gaps</GridWrap>
```

## Usage Examples

### Standard Page Layout
```tsx
export default function MyPage() {
  return (
    <PageWrap>
      <ContentWrap>
        <CardWrap variant="highlighted">
          <h1>Page Title</h1>
          <p>Page description</p>
        </CardWrap>
        
        <CardWrap>
          <h2>Content Section</h2>
          <GridWrap columns="3">
            <Item1 />
            <Item2 />
            <Item3 />
          </GridWrap>
        </CardWrap>
      </ContentWrap>
    </PageWrap>
  );
}
```

### Page with Sidebar
```tsx
export default function SidebarPage() {
  return (
    <PageWrap withSidebar>
      <aside className="bg-[#a9291c] text-white p-6">
        <Navigation />
      </aside>
      
      <main className="container-responsive">
        <ContentWrap>
          <CardWrap>
            <MainContent />
          </CardWrap>
        </ContentWrap>
      </main>
    </PageWrap>
  );
}
```

## Features

- **Responsive Design**: Automatically adapts to different screen sizes
- **Consistent Spacing**: Uses CSS custom properties for dynamic spacing
- **Layout Stability**: Prevents layout shifts with proper CSS containment
- **Smooth Transitions**: Hardware-accelerated animations
- **Accessibility**: Proper focus management and semantic structure
- **Design System**: Consistent with the app's visual design language

## CSS Classes Used

The components use these custom CSS classes defined in `globals.css`:

- `container-responsive`: Main responsive container
- `section-spacing`: Consistent section spacing
- `responsive-transition`: Smooth responsive transitions
- `layout-stable`: Prevents layout shifts
- `interactive-card`: Enhanced hover and focus states
- `align-stretch`: Ensures equal heights in grids

## Responsive Breakpoints

- **Mobile**: < 768px (100% width, smaller spacing)
- **Tablet**: 768px - 1023px (95% width, medium spacing)
- **Desktop**: 1024px - 1439px (90% width, larger spacing)
- **Ultra-wide**: ≥ 1440px (max 1600px width, largest spacing)