import { useState } from "react";
import { Book, ChevronDown, ChevronRight, Copy, Check, Search } from "lucide-react";
import SEOHead from "@/components/SEOHead";

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };
  return (
    <button onClick={handleCopy} className="ml-2 text-steel-mid hover:text-white transition-colors" title="Copy">
      {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
    </button>
  );
};

const ModeTable = () => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-white/10">
          <th className="text-left py-3 px-4 text-steel-mid font-semibold">Mode</th>
          <th className="text-left py-3 px-4 text-steel-mid font-semibold">What AI Does</th>
          <th className="text-left py-3 px-4 text-steel-mid font-semibold">When to Use</th>
        </tr>
      </thead>
      <tbody className="text-muted-foreground">
        <tr className="border-b border-white/5 hover:bg-white/5">
          <td className="py-3 px-4"><span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-medium">Full Auto</span></td>
          <td className="py-3 px-4">Everything &mdash; writes review, generates video script, scrapes photos, assigns star rating</td>
          <td className="py-3 px-4">When you want it all done and you&apos;ll review/edit later</td>
        </tr>
        <tr className="border-b border-white/5 hover:bg-white/5">
          <td className="py-3 px-4"><span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-medium">Video Only</span></td>
          <td className="py-3 px-4">Just creates a video script and video</td>
          <td className="py-3 px-4">When you want to write your own review but need the video</td>
        </tr>
        <tr className="border-b border-white/5 hover:bg-white/5">
          <td className="py-3 px-4"><span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs font-medium">Photos Only</span></td>
          <td className="py-3 px-4">Just finds product images from Amazon, Walmart, Target</td>
          <td className="py-3 px-4">When you have your own review written but need photos</td>
        </tr>
        <tr className="border-b border-white/5 hover:bg-white/5">
          <td className="py-3 px-4"><span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-xs font-medium">Review Only</span></td>
          <td className="py-3 px-4">Writes the review text and assigns a star rating</td>
          <td className="py-3 px-4">When you already have photos and video but need the written review</td>
        </tr>
        <tr className="hover:bg-white/5">
          <td className="py-3 px-4"><span className="px-2 py-1 rounded bg-gray-500/20 text-gray-400 text-xs font-medium">Manual</span></td>
          <td className="py-3 px-4">Nothing &mdash; just tracks the product for you</td>
          <td className="py-3 px-4">When you want to do everything yourself or you&apos;re not ready yet</td>
        </tr>
      </tbody>
    </table>
  </div>
);

const QuickReferenceTable = () => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-white/10">
          <th className="text-left py-3 px-4 text-steel-mid font-semibold">I want to&hellip;</th>
          <th className="text-left py-3 px-4 text-steel-mid font-semibold">Do this</th>
        </tr>
      </thead>
      <tbody className="text-muted-foreground">
        {[
          ["Add a product", "Click + Add Item, fill in the form"],
          ["Generate everything automatically", "Set mode to Full Auto, click Generate All"],
          ["Just get images", "Set mode to Photos Only, click Scrape Photos"],
          ["Write my own review but need video", "Set mode to Video Only, click Generate Video"],
          ["Just need help with the written review", "Set mode to Review Only, click Generate Review"],
          ["Just track a product, no AI", "Set mode to Manual"],
          ["Process everything at once", "Click Generate All Pending (skips Manual items)"],
          ["Copy review to Amazon", "Click Copy on the Generated card"],
          ["Edit AI review", "Click Edit on the Generated card"],
          ["See my completed reviews", "Click the Generated tab"],
          ["Add lots of products at once", "Click Import CSV"],
        ].map(([want, action], i) => (
          <tr key={i} className="border-b border-white/5 hover:bg-white/5">
            <td className="py-2 px-4 font-medium text-white/90">{want}</td>
            <td className="py-2 px-4">{action}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ActionsTable = () => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-white/10">
          <th className="text-left py-3 px-4 text-steel-mid font-semibold">Button</th>
          <th className="text-left py-3 px-4 text-steel-mid font-semibold">What It Does</th>
        </tr>
      </thead>
      <tbody className="text-muted-foreground">
        {[
          ["Edit", "Opens the review for editing \u2014 change the text, rating, pros/cons"],
          ["Copy", "Copies the review text to your clipboard so you can paste it into Amazon"],
          ["Photos", "Opens the photo finder to select/upload photos for this review"],
          ["Submit", "Marks the review as submitted (tracking purposes)"],
          ["Preview Video", "Shows a preview of the video that would be generated"],
          ["Delete (red trash icon)", "Removes the product entirely \u2014 be careful, this can't be undone!"],
        ].map(([button, desc], i) => (
          <tr key={i} className="border-b border-white/5 hover:bg-white/5">
            <td className="py-2 px-4 font-medium text-white/90">{button}</td>
            <td className="py-2 px-4">{desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SECTIONS: Section[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    content: (
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">Opening the App</h4>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
          <li>Open your web browser (Chrome works best)</li>
          <li>Go to <span className="text-primary font-medium">reesereviews.com</span></li>
          <li>If you see a login screen, enter the password and click <strong className="text-white">Login</strong></li>
        </ol>
        <h4 className="text-lg font-semibold text-white mt-6">Finding the Vine Review Page</h4>
        <p className="text-muted-foreground">
          Once logged in, click <strong className="text-white">&ldquo;Vine AI&rdquo;</strong> in the top navigation bar. This is where all the review magic happens.
        </p>
      </div>
    ),
  },
  {
    id: "dashboard",
    title: "The Dashboard",
    content: (
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">Stats Bar</h4>
        <p className="text-muted-foreground">A row of colored boxes showing your current numbers:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
          <li><strong className="text-white">Total</strong> &mdash; all products you&apos;ve added</li>
          <li><strong className="text-white">Pending</strong> &mdash; waiting to be reviewed</li>
          <li><strong className="text-white">Generating</strong> &mdash; currently being processed by AI</li>
          <li><strong className="text-white">Generated</strong> &mdash; AI has created the review, ready for you to check</li>
          <li><strong className="text-white">Edited</strong> &mdash; you&apos;ve made changes to the AI review</li>
          <li><strong className="text-white">Submitted</strong> &mdash; sent to Amazon</li>
          <li><strong className="text-white">Overdue</strong> &mdash; past the review deadline (these turn red!)</li>
        </ul>
        <h4 className="text-lg font-semibold text-white mt-6">Default Settings</h4>
        <p className="text-muted-foreground">Below the stats, you can set defaults that apply to all NEW items you add:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
          <li><strong className="text-white">Default Automation Mode</strong> &mdash; what level of automation you want</li>
          <li><strong className="text-white">Default Length for New Reviews</strong> &mdash; how long the video should be (30 sec, 1 min, 2 min, etc.)</li>
          <li><strong className="text-white">Default Avatar</strong> &mdash; which AI character reads the review (default is &ldquo;Reese&rdquo;)</li>
        </ul>
        <h4 className="text-lg font-semibold text-white mt-6">Tabs</h4>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
          <li><strong className="text-white">Review Queue</strong> &mdash; products waiting to be reviewed (your to-do list)</li>
          <li><strong className="text-white">Generated</strong> &mdash; products that already have AI-generated reviews</li>
          <li><strong className="text-white">Avatars</strong> &mdash; manage your AI reviewer characters</li>
          <li><strong className="text-white">Video Preview</strong> &mdash; preview generated review videos</li>
        </ul>
      </div>
    ),
  },
  {
    id: "adding-product",
    title: "Adding a Product",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">When a Vine product arrives and you&apos;re ready to start the review process:</p>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
          <li>Click the <strong className="text-white">&ldquo;+ Add Item&rdquo;</strong> button in the top right</li>
          <li>Fill in the form (see fields below)</li>
          <li>Click <strong className="text-white">&ldquo;+ Add Item&rdquo;</strong> to save it</li>
        </ol>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-steel-mid font-semibold">Field</th>
                <th className="text-left py-3 px-4 text-steel-mid font-semibold">What to Enter</th>
                <th className="text-left py-3 px-4 text-steel-mid font-semibold">Required?</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {[
                ["Amazon Product URL", "Paste the full Amazon link. The ASIN auto-fills!", "No, but helpful"],
                ["Product Name", "What the product is called (e.g., \"Wireless Bluetooth Earbuds\")", "Yes"],
                ["ASIN", "The Amazon product code (auto-fills from URL, like B0D1XD1ZV3)", "No, but needed for image scraping"],
                ["Category", "Pick the closest category (Electronics, Home, Beauty, etc.)", "Yes (defaults to Electronics)"],
                ["Automation Mode", "How much the AI should do", "Yes (uses your default)"],
                ["ETV ($)", "The Estimated Tax Value Amazon shows for this item", "No"],
                ["Order Date", "When you ordered it on Vine", "Auto-fills to today"],
                ["Review Deadline", "When the review is due (usually 30 days from order)", "Auto-fills to 30 days out"],
              ].map(([field, desc, req], i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2 px-4 font-medium text-white/90">{field}</td>
                  <td className="py-2 px-4">{desc}</td>
                  <td className="py-2 px-4 text-xs">{req}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-primary">
            <strong>Pro tip:</strong> If you paste an Amazon URL like <code className="bg-white/10 px-1 rounded text-xs">https://www.amazon.com/dp/B0D1XD1ZV3</code>, the ASIN fills in automatically and you&apos;ll see a little blue badge confirming it!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "automation-modes",
    title: "Understanding Automation Modes",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">This is the most important setting! It controls what the AI does for each product:</p>
        <ModeTable />
        <h4 className="text-lg font-semibold text-white mt-6">How to Set the Mode</h4>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
          <li><strong className="text-white">For all new items (default):</strong> Change the &ldquo;Default Automation Mode&rdquo; dropdown at the top of the page.</li>
          <li><strong className="text-white">For a specific item:</strong> Change the &ldquo;Automation Mode&rdquo; dropdown in the add form. This overrides the default for just that item.</li>
        </ul>
        <h4 className="text-lg font-semibold text-white mt-6">What Each Mode Looks Like on the Card</h4>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
          <li><strong className="text-green-400">Full Auto</strong> &rarr; Shows &ldquo;Full Auto&rdquo; badge + <strong className="text-white">&ldquo;Generate All&rdquo;</strong> button</li>
          <li><strong className="text-blue-400">Video Only</strong> &rarr; Shows &ldquo;Video Only&rdquo; badge + <strong className="text-white">&ldquo;Generate Video&rdquo;</strong> button</li>
          <li><strong className="text-purple-400">Photos Only</strong> &rarr; Shows &ldquo;Photos Only&rdquo; badge + <strong className="text-white">&ldquo;Scrape Photos&rdquo;</strong> button</li>
          <li><strong className="text-amber-400">Review Only</strong> &rarr; Shows &ldquo;Review Only&rdquo; badge + <strong className="text-white">&ldquo;Generate Review&rdquo;</strong> button</li>
          <li><strong className="text-gray-400">Manual</strong> &rarr; Shows &ldquo;Manual&rdquo; badge + <strong className="text-white">no generate button</strong> (just delete)</li>
        </ul>
      </div>
    ),
  },
  {
    id: "generating",
    title: "Generating a Review",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">Once a product is in your Review Queue:</p>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
          <li>Find the product card in the <strong className="text-white">Review Queue</strong> tab</li>
          <li>Click the action button on the card:
            <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
              <li>&ldquo;Generate All&rdquo; for Full Auto</li>
              <li>&ldquo;Generate Video&rdquo; for Video Only</li>
              <li>&ldquo;Scrape Photos&rdquo; for Photos Only</li>
              <li>&ldquo;Generate Review&rdquo; for Review Only</li>
            </ul>
          </li>
          <li>Wait a few seconds &mdash; you&apos;ll see a spinning icon while it works</li>
          <li>When done, a green success message appears and the product moves to the <strong className="text-white">Generated</strong> tab</li>
        </ol>
        <h4 className="text-lg font-semibold text-white mt-6">What Gets Generated (Full Auto Mode)</h4>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
          <li><strong className="text-white">Review Title</strong> &mdash; a catchy, honest headline</li>
          <li><strong className="text-white">Review Body</strong> &mdash; 2&ndash;3 paragraphs of natural-sounding review text</li>
          <li><strong className="text-white">Star Rating</strong> &mdash; 1 to 5 stars based on the product category and value</li>
          <li><strong className="text-white">Pros</strong> &mdash; 3 positive things about the product</li>
          <li><strong className="text-white">Video Script</strong> &mdash; a script for a 30&ndash;60 second review video</li>
          <li><strong className="text-white">Scraped Images</strong> &mdash; product photos from Amazon listings and international reviews</li>
        </ul>
      </div>
    ),
  },
  {
    id: "scraping-images",
    title: "Scraping Product Images",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">The image scraper finds real product photos from multiple sources so your review looks authentic:</p>
        <h4 className="text-lg font-semibold text-white">Where Images Come From</h4>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
          <li><strong className="text-white">Amazon Listing</strong> &mdash; the main product page images</li>
          <li><strong className="text-white">Amazon UK Reviews</strong> &mdash; buyer photos from Amazon.co.uk</li>
          <li><strong className="text-white">Amazon DE Reviews</strong> &mdash; buyer photos from Amazon.de (Germany)</li>
          <li><strong className="text-white">Amazon JP Reviews</strong> &mdash; buyer photos from Amazon.co.jp (Japan)</li>
          <li><strong className="text-white">Walmart Reviews</strong> &mdash; buyer photos from Walmart.com</li>
          <li><strong className="text-white">Target Reviews</strong> &mdash; buyer photos from Target.com</li>
        </ul>
        <h4 className="text-lg font-semibold text-white mt-6">How to Scrape Images</h4>
        <p className="text-muted-foreground"><strong className="text-white">Option 1 &mdash; Automatic:</strong> In Full Auto or Photos Only mode, click the main action button and images are scraped as part of the process.</p>
        <p className="text-muted-foreground"><strong className="text-white">Option 2 &mdash; Standalone:</strong> If your card shows a &ldquo;Scrape Images&rdquo; button (outline style), click it to just scrape images without generating a review.</p>
        <h4 className="text-lg font-semibold text-white mt-6">After Scraping</h4>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
          <li>A success message shows how many images were found and from which sources</li>
          <li>Source badges appear on the card (e.g., &ldquo;Amazon UK Review&rdquo;, &ldquo;Walmart Review&rdquo;)</li>
          <li>The &ldquo;Scrape Images&rdquo; button disappears (since images are already scraped)</li>
        </ul>
      </div>
    ),
  },
  {
    id: "editing",
    title: "Reviewing and Editing Generated Content",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">After a review is generated, the product moves to the <strong className="text-white">Generated</strong> tab. Each card shows action buttons:</p>
        <ActionsTable />
        <h4 className="text-lg font-semibold text-white mt-6">Editing a Review</h4>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
          <li>Click <strong className="text-white">Edit</strong> on the product card</li>
          <li>Change anything you want &mdash; title, body text, star rating, pros, cons</li>
          <li>Save your changes</li>
          <li>The status changes from &ldquo;Generated&rdquo; to &ldquo;Edited&rdquo;</li>
        </ol>
        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm text-amber-400">
            <strong>Important:</strong> Always read through AI-generated reviews before submitting! Make sure they sound natural, don&apos;t mention features the product doesn&apos;t have, and include the Vine disclosure.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "uploading-photos",
    title: "Uploading Your Own Photos",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">If you took your own photos of the product (great for authenticity!):</p>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
          <li>Click <strong className="text-white">Photos</strong> on the product card</li>
          <li>Select photos from your phone/computer (up to 8 photos)</li>
          <li>The app automatically strips EXIF data from your photos (removes location data and camera info for privacy)</li>
          <li>You&apos;ll see a count like &ldquo;4/8 photos selected (EXIF stripped)&rdquo;</li>
        </ol>
        <h4 className="text-lg font-semibold text-white mt-6">Tips for photos</h4>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
          <li>Take them with good lighting (natural light is best)</li>
          <li>Show the product from different angles</li>
          <li>Include the product in use if possible</li>
          <li>Keep filenames casual &mdash; the app handles this automatically</li>
        </ul>
      </div>
    ),
  },
  {
    id: "bulk-actions",
    title: "Bulk Actions",
    content: (
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">Generate All Pending</h4>
        <p className="text-muted-foreground">
          Click <strong className="text-white">&ldquo;Generate All Pending&rdquo;</strong> in the top right to process ALL pending items at once.
        </p>
        <div className="mt-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-400">
            <strong>Note:</strong> Manual mode items are SKIPPED &mdash; they won&apos;t be processed (this is by design). Each item is processed according to its own automation mode.
          </p>
        </div>
        <h4 className="text-lg font-semibold text-white mt-6">When to Use Bulk Generate</h4>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
          <li>When you have a bunch of products that all arrived and you want to process them all at once</li>
          <li>Great for &ldquo;Photos Only&rdquo; mode &mdash; scrape images for everything in one click</li>
        </ul>
      </div>
    ),
  },
  {
    id: "csv-import",
    title: "Importing Multiple Products (CSV)",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">If you have a lot of products to add at once:</p>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
          <li>Click <strong className="text-white">&ldquo;Import CSV&rdquo;</strong> in the top right</li>
          <li>Either upload a CSV file or paste the data directly</li>
          <li>Click <strong className="text-white">Import</strong> to add all items at once</li>
        </ol>
        <div className="mt-4 p-4 rounded-lg bg-[#1a1a2e] border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-steel-mid font-mono">CSV Format</span>
            <CopyButton text="productName,asin,category,orderDate,reviewDeadline,etv" />
          </div>
          <pre className="text-sm text-green-400 font-mono overflow-x-auto">
{`productName,asin,category,orderDate,reviewDeadline,etv
Wireless Mouse,B0EXAMPLE1,electronics,2026-03-01,2026-04-15,29.99
USB-C Hub,B0EXAMPLE2,electronics,2026-03-01,2026-04-15,45.00`}
          </pre>
        </div>
      </div>
    ),
  },
  {
    id: "avatars",
    title: "Managing Avatars",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          The <strong className="text-white">Avatars</strong> tab lets you manage the AI characters that &ldquo;present&rdquo; your reviews in videos:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
          <li><strong className="text-white">Reese</strong> is the default avatar (female, stock)</li>
          <li>You can add custom avatars with different names, genders, and styles</li>
          <li>The avatar you select is used for video generation</li>
        </ul>
      </div>
    ),
  },
  {
    id: "video-preview",
    title: "Video Preview",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          The <strong className="text-white">Video Preview</strong> tab shows a slideshow-style preview of how the review video would look:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
          <li>Each slide shows one point from the review</li>
          <li>Video length is configurable (30 seconds to 3 minutes)</li>
          <li>The default is 1 minute (6 slides at 10 seconds each)</li>
        </ul>
      </div>
    ),
  },
  {
    id: "data-storage",
    title: "Where Your Data Lives",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">Right now, all your data is saved in your <strong className="text-white">browser&apos;s local storage</strong>. This means:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
          <li>Your data is saved automatically as you work</li>
          <li>It survives page refreshes and closing/reopening the browser</li>
          <li>It does NOT sync between different browsers or devices</li>
          <li>If you clear your browser data, your reviews will be lost</li>
        </ul>
        <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-primary">
            When Supabase is fully connected, your data will sync to the cloud and be available on any device.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "tips",
    title: "Tips and Tricks",
    content: (
      <div className="space-y-3">
        {[
          ["Set your default mode first", "Before adding a bunch of items, set your Default Automation Mode. New items inherit this mode."],
          ["Use Photos Only for quick wins", "If you just need images fast, set mode to \"Photos Only\" and click \"Scrape Photos.\" It's the fastest mode."],
          ["ASIN is key for image scraping", "Always include the ASIN (from the Amazon URL) when adding items. Without it, the image scraper can't find photos."],
          ["Check the Generated tab", "After generating, items move from \"Review Queue\" to \"Generated.\" Don't panic if they disappear from the queue!"],
          ["Copy to clipboard", "Use the \"Copy\" button to grab review text, then paste it directly into Amazon's review form."],
          ["Watch deadlines", "Items turn yellow when the deadline is approaching and red when overdue. The card shows days remaining."],
          ["Manual mode for tracking", "Use Manual mode for products you want to organize but aren't ready to review yet."],
          ["The app works offline", "Since data is in local storage, you don't need an internet connection to view and organize your reviews."],
        ].map(([title, desc], i) => (
          <div key={i} className="flex gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
            <div>
              <p className="font-medium text-white text-sm">{title}</p>
              <p className="text-muted-foreground text-sm">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    content: (
      <div className="space-y-4">
        {[
          ["\"OpenRouter API key not configured\"", "The AI text generation service isn't connected yet. The app will still work in demo mode (generating placeholder reviews). Ask Mom to set up the API key."],
          ["\"Failed to generate review\"", "This usually happens when the AI service is down or the API key is missing. Try again later, or switch to Manual mode and write the review yourself."],
          ["Items disappeared", "Check the Generated tab! Items move there after being processed. If they're truly gone, the browser's local storage may have been cleared."],
          ["Photos not showing after upload", "Make sure your photos are in a standard format (JPG, PNG). Very large files may take a moment to process through the EXIF stripper."],
          ["App shows a blank white page", "Try refreshing the page. If it persists, clear the browser cache (but note this will delete your saved data) or ask for help."],
          ["Review deadline is wrong", "You can't edit the deadline after creating an item right now. If it's wrong, delete the item and re-add it with the correct date."],
        ].map(([issue, fix], i) => (
          <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="font-medium text-amber-400 text-sm mb-1">{issue}</p>
            <p className="text-muted-foreground text-sm">{fix}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "quick-reference",
    title: "Quick Reference Card",
    content: <QuickReferenceTable />,
  },
];

export default function DocsPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(SECTIONS.map((s) => s.id))
  );
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedSections(new Set(SECTIONS.map((s) => s.id)));
  const collapseAll = () => setExpandedSections(new Set());

  const filteredSections = searchQuery
    ? SECTIONS.filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : SECTIONS;

  return (
    <>
      <SEOHead
        title="User Manual"
        description="Step-by-step guide for using the Vine Review Auto-Generator."
        noIndex
      />
      <div className="min-h-screen gradient-dark-surface pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Book className="h-8 w-8 text-primary" />
              <h1 className="font-serif text-3xl font-bold gradient-steel-text md:text-4xl">
                User Manual
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Step-by-step guide for the Vine Review Auto-Generator
            </p>
            <p className="text-sm text-steel-mid mt-1">For Reese (and anyone helping with Vine reviews)</p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-steel-mid" />
              <input
                type="text"
                placeholder="Search sections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search documentation sections"
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-steel-mid text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
            <button onClick={expandAll} className="px-3 py-2 text-xs text-steel-mid hover:text-white transition-colors rounded-lg bg-white/5 hover:bg-white/10">
              Expand All
            </button>
            <button onClick={collapseAll} className="px-3 py-2 text-xs text-steel-mid hover:text-white transition-colors rounded-lg bg-white/5 hover:bg-white/10">
              Collapse All
            </button>
          </div>

          {/* Table of Contents */}
          <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-semibold text-steel-mid uppercase tracking-wider mb-3">Contents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {filteredSections.map((section, i) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors py-1 px-2 rounded hover:bg-white/5"
                >
                  <span className="text-steel-mid mr-2">{i + 1}.</span>
                  {section.title}
                </a>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-3">
            {filteredSections.map((section) => {
              const isExpanded = expandedSections.has(section.id);
              return (
                <div
                  key={section.id}
                  id={section.id}
                  className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-white/5 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-steel-mid flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-steel-mid flex-shrink-0" />
                    )}
                    <h2 className="text-lg font-semibold text-white">{section.title}</h2>
                  </button>
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-0">
                      <div className="border-t border-white/5 pt-4">
                        {section.content}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-sm text-steel-mid italic">
              Made with love for Reese. If something doesn&apos;t make sense, just ask!
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
