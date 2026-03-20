# Topic: n8n-workflows

> 9 insights

- `INS-260320-D3D5` [high] Process items sequentially in n8n batch loops to respect API rate limits -- pull from a queue (e.g., Google Sheets rows), process one at a time, and skip already-completed items.
- `INS-260320-C9B1` [high] An n8n workflow scrapes any business URL and generates a full analysis report (overview, audience personas, brand analysis, customer journey, E-E-A-T) for approximately $0.20 per run.
- `INS-260320-6A9D` [high] Safety-first scraping: decouple your personal account from the scraping tool. If the tool gets flagged, your account is unaffected.
- `INS-260320-336E` [high] Chain specialized AI agents in n8n -- scraper (Firecrawl) feeds analyst (Perplexity) feeds formatter (Gemini) -- each agent does one job well, keeping the pipeline modular and cheap.
- `INS-260320-0063` [high] n8n workflows can be exported as JSON and shared on GitHub with Google Doc templates -- the business analysis workflow repo has 98 stars and is MIT licensed.
- `INS-260320-6845` [high] An n8n workflow pulls YouTube links from Google Sheets, extracts transcripts via Dumpling AI, transforms them into newsletter drafts with GPT-4o, and logs results back to Sheets.
- `INS-260320-71C1` [medium] Full pipeline: search query to scrape 100+ profiles, extract data, pull company info, AI-generate personalized opener, export to Google Sheets.
- `INS-260320-CEBE` [medium] A single YouTube transcript can feed newsletter drafts, social media posts, blog articles, and email campaigns -- extend the base n8n workflow with parallel output branches.
- `INS-260320-B8B0` [medium] Use Linkfinder AI as a proxy for LinkedIn scraping — no direct LinkedIn API connection means zero ban risk for your personal account.
