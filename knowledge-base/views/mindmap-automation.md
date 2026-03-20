# automation

## content-creation
- An n8n workflow scrapes YouTube, Reddit, Twitter, and the web daily to identify content outliers and trending topics, then generates detailed content ideas with scripts, hooks, and storylines.
- A daily n8n content research automation that scrapes multiple platforms, identifies trends, and delivers a content digest costs under $0.35 per day to operate.
- The 0-to-175K growth came from automating content research and ideation, not from automating content creation itself -- the competitive advantage is knowing what to create, not how to create it.

## n8n-workflows
- Full pipeline: search query to scrape 100+ profiles, extract data, pull company info, AI-generate personalized opener, export to Google Sheets.
- Process items sequentially in n8n batch loops to respect API rate limits -- pull from a queue (e.g., Google Sheets rows), process one at a time, and skip already-completed items.
- An n8n workflow scrapes any business URL and generates a full analysis report (overview, audience personas, brand analysis, customer journey, E-E-A-T) for approximately $0.20 per run.
- Safety-first scraping: decouple your personal account from the scraping tool. If the tool gets flagged, your account is unaffected.
- Chain specialized AI agents in n8n -- scraper (Firecrawl) feeds analyst (Perplexity) feeds formatter (Gemini) -- each agent does one job well, keeping the pipeline modular and cheap.
- A single YouTube transcript can feed newsletter drafts, social media posts, blog articles, and email campaigns -- extend the base n8n workflow with parallel output branches.
- n8n workflows can be exported as JSON and shared on GitHub with Google Doc templates -- the business analysis workflow repo has 98 stars and is MIT licensed.
- Use Linkfinder AI as a proxy for LinkedIn scraping — no direct LinkedIn API connection means zero ban risk for your personal account.
- An n8n workflow pulls YouTube links from Google Sheets, extracts transcripts via Dumpling AI, transforms them into newsletter drafts with GPT-4o, and logs results back to Sheets.
