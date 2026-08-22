# Daily-News-For-MBAs
This web-based AI agent generates a daily news brief for MBA students . This brief explain "What Happened", "Why It Matters", related "MBA Concept", and "Case-Study Insight". It also asks probing "Management Question" for the students.

Today's MBA Business Brief
> An AI-powered web application that transforms **today's Indian business news into concise MBA case-study insights**.
Overview
Today's MBA Business Brief is an experimental full-stack application built to explore cross-platform AI-agent integration.
The web application provides a simple interface where users can click "Generate Today's Brief". The application then calls an existing MBA News Agent running in Anaconda Agent Studio through its REST API.
The Anaconda agent is responsible for retrieving and analysing the news. The web application is responsible for presenting the results, storing generated articles, and providing historical access.
Core transformation
```text
Today's Business News
        ↓
Business Implication
        ↓
MBA Concept
        ↓
Case-Study Insight
        ↓
Management Question
```
---
Key Objective
The project has two objectives:
Build a useful daily MBA business-news briefing application.
Experiment with calling an AI agent created on one platform from a web application created on another platform.
This means the application intentionally separates the AI-agent layer from the web-application layer.
---
Architecture
```text
┌─────────────────────────────────────────────┐
│              Web Application                │
│                                             │
│  Today's Brief | History                   │
│  Generate Today's Brief                    │
└──────────────────────┬──────────────────────┘
                       │
                       │ POST
                       ▼
┌─────────────────────────────────────────────┐
│          Application Backend                │
│                                             │
│  /api/generate-brief                        │
│  /api/history                               │
│  /api/history/:date                         │
│  /api/brief/:generationId                   │
└──────────────────────┬──────────────────────┘
                       │
                       │ REST API
                       ▼
┌─────────────────────────────────────────────┐
│       Anaconda Agent Studio                 │
│                                             │
│          MBA News Agent                    │
│                                             │
│  Claude Sonnet 4.6                          │
│  + Web/Search capabilities                  │
│  + MBA analysis instructions                │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
        Mint | Economic Times | The Hindu
                       │
                       ▼
              MBA News Analysis
                       │
                       ▼
┌─────────────────────────────────────────────┐
│             SQLite Database                │
│                                             │
│  Generated articles                         │
│  Generation dates/times                     │
│  Historical briefs                          │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
                Web Application
```
---
News Source Rules
The MBA News Agent is configured to use only:
Mint
Economic Times
The Hindu
The agent should not substitute other publications.
Date requirement
"Today" is defined using India Standard Time (IST / UTC+5:30).
The agent is instructed to:
Find articles originally published today.
Reject older articles that were only updated today.
Reject articles whose original publication date cannot be verified.
Return fewer than three articles if fewer than three qualifying articles are available.
Never use older articles merely to reach a target of three stories.
---
MBA Analysis
For each selected article, the agent produces:
What happened?
A concise explanation of the event.
Why does it matter?
The business significance and strategic implications.
MBA Concept
The most relevant concept, such as:
Competitive Strategy
Cost Leadership
Differentiation
Economies of Scale
Vertical Integration
Market Entry
M&A
Corporate Finance
Capital Allocation
Pricing Strategy
Supply Chain
Operations
Marketing
Innovation
Digital Transformation
Industry Structure
Network Effects
Regulation
Entrepreneurship
Organizational Behaviour
MBA Case-Study Insight
A concise management lesson derived from the news.
Management Question
A thought-provoking question suitable for MBA classroom discussion.
The agent also provides 3 overall MBA takeaways.
---
Frontend
The application is designed as a clean MBA/business-intelligence interface.
Main features
Today's date in IST
Generate Today's Brief button
Three structured news cards
Source and publication information
MBA concepts
Case-study insights
Management questions
Overall MBA takeaways
Loading/progress states
Error handling
Historical archive
History
The frontend provides a History section where users can browse previously generated briefs.
Historical records are grouped by generation date and can be opened without triggering another call to the Anaconda agent.
---
Backend
The application backend acts as a proxy between the frontend and Anaconda Agent Studio.
Main endpoint
```text
POST /api/generate-brief
```
The backend sends the following request to the Anaconda agent:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Generate today's MBA Business Brief for India."
    }
  ],
  "stream": false
}
```
Anaconda Agent endpoint
For the current local development setup:
```text
http://127.0.0.1:54321/api/agents/mba-news/chat
```
The endpoint is stored through an environment variable:
```text
ANACONDA_AGENT_URL
```
Example:
```env
ANACONDA_AGENT_URL=http://127.0.0.1:54321/api/agents/mba-news/chat
```
---
Database
The prototype uses SQLite for local persistence.
Suggested database:
```text
mba_news.db
```
`news_articles`
Stores the individual articles generated by the agent.
Suggested fields:
```text
id
generation_date
generation_timestamp
article_number
headline
source
publication_date
what_happened
why_it_matters
mba_concept
case_study_insight
management_question
article_url
raw_response_id
```
`brief_generations`
Stores each generation event.
Suggested fields:
```text
id
generation_date
generation_timestamp
raw_agent_response
status
```
All application-level generation timestamps should use:
```text
Asia/Kolkata
```
---
Technology Stack
Frontend
React
TypeScript
Responsive web UI
Backend
Node.js
TypeScript
REST API
Database
SQLite
AI Agent
Anaconda Agent Studio
Claude Sonnet 4.6
Existing MBA News Agent
---
Environment Configuration
Create an environment variable for the Anaconda agent endpoint:
```env
ANACONDA_AGENT_URL=http://127.0.0.1:54321/api/agents/mba-news/chat
```
Do not commit sensitive credentials or `.env` files to GitHub.
A `.env.example` file can contain:
```env
ANACONDA_AGENT_URL=http://127.0.0.1:54321/api/agents/mba-news/chat
```
---
Running Locally
1. Start Anaconda Agent Studio
Open the MBA News agent in Anaconda Agent Studio and make sure the agent runtime is running.
The local API server should expose the Chat/REST endpoint.
2. Start the web application
Install the project's dependencies and start the development server using the commands defined by the generated project configuration.
For example:
```bash
npm install
npm run dev
```
> The exact commands may differ depending on the final Google AI Studio-generated project structure.
3. Configure the environment variable
Set:
```env
ANACONDA_AGENT_URL=http://127.0.0.1:54321/api/agents/mba-news/chat
```
4. Open the application
Open the local URL displayed by the development server.
5. Generate the brief
Click:
```text
Generate Today's Brief
```
The application should call the Anaconda agent and display the returned MBA business brief.
---
Important Local Development Limitation
The current integration uses:
```text
127.0.0.1
```
which means the Anaconda API is available only on the local machine.
This is intentional for the current experimentation phase.
The local architecture is:
```text
Browser
   ↓
Local Web App
   ↓
Local Backend
   ↓
127.0.0.1:54321
   ↓
Anaconda Agent Studio
```
If the web application is later deployed to a cloud environment, `127.0.0.1` will refer to the cloud server rather than the developer's laptop.
A future production deployment would therefore require a publicly reachable, securely authenticated endpoint for the Anaconda agent or a different deployment architecture.
---
Error Handling
The application should clearly handle:
Agent not running
```text
Unable to connect to the MBA News Agent.
Please start the MBA News agent in Anaconda Agent Studio and try again.
```
API unavailable
```text
Could not connect to the Anaconda Agent Studio API.
```
Agent error
```text
The MBA News Agent encountered an error while generating today's brief.
```
Parsing error
```text
The agent returned a response, but the application could not structure it correctly.
```
Failed or incomplete responses should not be silently stored as valid news records.
---
Design Principles
The application intentionally follows a:
Minimal
Professional
MBA/consulting-oriented
High-readability
Editorial
Information-first
design language.
The goal is to make the application feel like an MBA student's daily business intelligence assistant, rather than a generic AI chatbot.
---
Project Philosophy
This project is primarily an AI-agent experimentation project.
The most important learning is not simply building a news dashboard.
It is understanding how:
```text
Agent Platform A
       ↓
      API
       ↓
Application Platform B
       ↓
      User
```
can work together.
In this implementation:
```text
Anaconda Agent Studio
        +
Google AI Studio
        +
REST API
        +
SQLite
        =
Cross-platform AI-agent web application
```
---
Future Enhancements
Potential future improvements include:
MBA Case Mode
Industry filters
MBA-framework filters
Searchable history
Article-level source links
Multiple agent orchestration
Agent performance monitoring
Scheduled daily brief generation
Email delivery
WhatsApp/Telegram delivery
Public cloud deployment
Secure authentication
Persistent cloud database
API authentication
Analytics on most frequent MBA concepts
Daily/weekly/monthly MBA trend analysis
---
Project Status
Current stage: Experimental prototype
The primary objective is to demonstrate a working connection between a web application and an AI agent running in Anaconda Agent Studio through a REST API.
---
Disclaimer
This application is an educational and experimental project.
News availability, publication dates, source content, and AI-generated MBA interpretations should be independently verified before being used for academic, professional, investment, or business decisions.
