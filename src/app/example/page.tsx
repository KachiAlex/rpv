import { PageWrap, ContentWrap, CardWrap, GridWrap } from '@/components/layout/screen-wrap';

export default function ExamplePage() {
  return (
    <PageWrap>
      <ContentWrap spacing="loose">
        <CardWrap variant="highlighted">
          <h1 className="text-3xl font-bold text-[#a9291c] mb-4">Screen Wrap Example</h1>
          <p className="text-[#4a3a33]">
            This page demonstrates the usage of the ScreenWrap components for consistent layout and responsive behavior.
          </p>
        </CardWrap>

        <CardWrap>
          <h2 className="text-2xl font-semibold text-[#4a2c26] mb-4">Grid Layout Example</h2>
          <p className="text-[#6a4c43] mb-6">
            The GridWrap component automatically adjusts from 1 column on mobile to 3 columns on desktop.
          </p>
          
          <GridWrap columns="auto" gap="md">
            <div className="bg-[#fff6f1] border border-[#f2e5df] rounded-lg p-4">
              <h3 className="font-semibold text-[#4a2c26] mb-2">Card 1</h3>
              <p className="text-sm text-[#6a4c43]">This is the first example card in the responsive grid.</p>
            </div>
            
            <div className="bg-[#fff6f1] border border-[#f2e5df] rounded-lg p-4">
              <h3 className="font-semibold text-[#4a2c26] mb-2">Card 2</h3>
              <p className="text-sm text-[#6a4c43]">This is the second example card with equal height.</p>
            </div>
            
            <div className="bg-[#fff6f1] border border-[#f2e5df] rounded-lg p-4">
              <h3 className="font-semibold text-[#4a2c26] mb-2">Card 3</h3>
              <p className="text-sm text-[#6a4c43]">This is the third example card demonstrating consistent spacing.</p>
            </div>
          </GridWrap>
        </CardWrap>

        <CardWrap interactive>
          <h2 className="text-2xl font-semibold text-[#4a2c26] mb-4">Interactive Card</h2>
          <p className="text-[#6a4c43]">
            This card has interactive hover effects. Try hovering over it to see the smooth transitions.
          </p>
        </CardWrap>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardWrap variant="minimal">
            <h3 className="text-lg font-semibold text-[#4a2c26] mb-3">Minimal Card</h3>
            <p className="text-sm text-[#6a4c43]">
              This uses the minimal variant with less padding and a subtle border.
            </p>
          </CardWrap>
          
          <CardWrap>
            <h3 className="text-lg font-semibold text-[#4a2c26] mb-3">Default Card</h3>
            <p className="text-sm text-[#6a4c43]">
              This uses the default card styling with standard padding and border.
            </p>
          </CardWrap>
        </div>
      </ContentWrap>
    </PageWrap>
  );
}