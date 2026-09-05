# CloudInsight AI – AI-Powered Business Analytics

A production-grade, full-stack AI business intelligence application powered by **Gemini 3.6 Flash**, **Cloud Firestore**, **Firebase Authentication**, and **Google Cloud Run**.

> *"Turn business data into intelligent decisions with Gemini."*

---

## Architecture & Security Highlights

1. **Enterprise Identity Isolation**: Authenticated via Google Sign-In with Firebase Auth. Eliminates custom password storage, providing enterprise-grade OAuth token verification.
2. **Owner-Bound Cloud Firestore**: All business datasets, analytical queries, and generated executive reports are strictly scoped to `/users/{userId}/interactions/{interactionId}`. Security rules guarantee that users can never access or query other users' datasets.
3. **Resilient Gemini Fallback Ladder**: Backend API routes implement an automated fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`) with error recovery for high availability.
4. **Zero Client Secret Exposure**: All AI calls are proxied through an Express backend where `GEMINI_API_KEY` is injected server-side via Google Cloud Secret Manager or container environment variables. Secrets are never exposed to the client browser.
5. **Grounded Numerical Computing (Zero Hallucinations)**: Queries are verified against actual dataset statistics before passing to Gemini. The model is strictly instructed never to fabricate numbers and to return *"I cannot determine this from the available data"* whenever requested metrics are unavailable.

---

## Agentic Threat Modeling & Mitigation Matrix

| Threat Zone | Vulnerability Vector | Implemented Countermeasure |
| :--- | :--- | :--- |
| **Input Surfaces** | Malformed CSV/Excel, oversized files, prompt injection | File size caps (25MB), typed client parsing (`PapaParse`, `xlsx`), server input validation, character limits (3,000 chars) |
| **Planning & Reasoning** | System instruction bypass, hallucinated metrics | Delimited system instructions, deterministic calculation layer, mandatory 4-part analytical format (Answer, Key Finding, Insight, Recommendation) |
| **Tool & API Execution** | SSRF, privilege escalation, token hijacking | Backend-only Express proxy routes, zero browser-accessible credentials, parameterized queries |
| **Memory & State** | Cross-tenant data breach, session hijacking | Owner-bound Firestore rules (`request.auth.uid == userId`), defensive undefined-stripping prior to writes |
| **Inter-System Communication** | Quota exhaustion, transient upstream 503 errors | Resilient fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`) |

---

## Prerequisites & Google Cloud APIs

Ensure the Google Cloud SDK (`gcloud`) is installed and authenticated to your project:

```bash
# Set default project
gcloud config set project YOUR_PROJECT_ID

# Enable essential Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  identitytoolkit.googleapis.com
```

---

## Secret Management Setup

Create and bind your Gemini API key in Google Cloud Secret Manager, and grant the Cloud Run runtime service account permission to access the secret:

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## Firestore Database & Security Rules Configuration

Deploy the owner-bound security rules to ensure strict per-user data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy the rules via the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables in .env
cp .env.example .env
# Set GEMINI_API_KEY=your_key_here

# 3. Start the full-stack development server (Express + Vite)
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## Production Build & Cloud Run Deployment

Deploy the containerized application directly using Google Cloud Run:

```bash
# Build and deploy service to Cloud Run with required verification label
gcloud run deploy cloudinsight-ai \
  --source . \
  --project YOUR_PROJECT_ID \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000 \
  --set-labels dev-tutorial=cloud-run-ai-challenge
```

### Campaign Verification Binding (Standalone Update)

If the service is already deployed, you can apply or update the mandatory verification label separately:

```bash
gcloud run services update cloudinsight-ai \
  --project YOUR_PROJECT_ID \
  --region asia-southeast1 \
  --update-labels=dev-tutorial=cloud-run-ai-challenge
```

---

## Functional Stability & Comprehensive Test Walkthrough

Every user workflow in CloudInsight AI is designed with deterministic validation and error recovery:

### Test Case 1: Google Authentication & Identity Verification
1. Open the application in an incognito window or unauthenticated state.
2. Confirm the Landing Page presents "CloudInsight AI", the tagline *"Turn business data into intelligent decisions with Gemini"*, and the feature overview cards.
3. Click **Sign in with Google**.
4. Complete Google authentication popup.
5. Verify automatic redirect to the Business Analytics Dashboard with your user avatar, display name, and a green "Firestore Synced" status badge.

### Test Case 2: Data Upload & Automatic Schema Detection
1. Navigate to **Data Upload** via the sidebar.
2. Drag and drop or browse to select a `.csv` or `.xlsx` spreadsheet.
3. Verify file validation runs:
   - If empty (0 bytes), an error banner is displayed.
   - If valid, the confirmation banner *"Dataset successfully loaded"* appears.
4. Verify the detected column summary:
   - Data types: `numeric`, `text`, `date`.
   - Business roles: `sales`, `profit`, `quantity`, `category`, `product`, `city`, `date`.
5. Verify the 10-row preview table renders with column headers and records.
6. Click **Try Sample Enterprise Dataset** to verify instant fallback dataset loading.

### Test Case 3: Interactive KPI Dashboard & Dynamic Slicers
1. Navigate to the **Dashboard** view.
2. Verify all 6 core KPI cards render:
   - Total Sales, Total Profit, Total Orders, Average Order Value, Total Quantity, Profit Margin.
   - For datasets lacking sales or profit columns, verify the card displays *"Not available for this dataset"*.
3. Test the Filter Bar:
   - Select a specific **Category** (e.g., "Technology") &rarr; confirm KPI values and chart distributions update in real time.
   - Select a specific **City** (e.g., "New York") &rarr; confirm slice records counter reflects the match.
   - Type in **Product Search** &rarr; confirm live matching.
   - Click **Reset Filters** &rarr; confirm all metrics return to full dataset aggregates.

### Test Case 4: Interactive Visualizations (Recharts)
1. Verify the **Sales Trend Over Time** area chart renders chronological revenue.
2. Verify the **Sales by Category** bar chart shows category breakdowns.
3. Verify the **Profit by Category** bar chart renders margin contributions.
4. Verify the **Top 10 Products by Sales** horizontal leaderboard.
5. Verify the **Sales by City** regional distribution.
6. Hover over data points and bars to verify formatted tooltips (e.g., currency formatting `$4,998`).

### Test Case 5: "Ask CloudInsight AI" Natural Language Querying
1. Navigate to **AI Analyst** via the sidebar.
2. Click any of the pre-configured question chips:
   - *"What is my best performing category?"*
   - *"Which city generated the highest sales?"*
   - *"What are my top 5 products by profit?"*
3. Click **Ask CloudInsight AI** or press `Cmd + Enter`.
4. Verify the AI report renders within seconds, formatted into:
   - `### ANSWER`: Direct 1-2 sentence commercial answer.
   - `### KEY FINDING`: Exact verified metric from the dataset.
   - `### BUSINESS INSIGHT`: Strategic analytical interpretation.
   - `### RECOMMENDATION`: Actionable commercial recommendation.
5. Ask a question about data not present in the dataset (e.g., *"What is employee headcount?"*) &rarr; verify the response clearly states: *"I cannot determine this from the available data."*

### Test Case 6: Executive AI Insights Card Generation
1. In the AI Analyst view, click **Generate AI Insights**.
2. Verify 4 executive cards are synthesized:
   - **Key Insight**
   - **Opportunity**
   - **Risk**
   - **Recommendation**
3. Verify automatic persistence to Cloud Firestore.

### Test Case 7: Analysis History & Persistence Verification
1. Navigate to **Analysis History** via the sidebar.
2. Verify past queries appear in reverse chronological order with timestamp and dataset tags.
3. Use the search bar to filter past queries by keyword.
4. Click on an entry to review the complete analytical report and snapshot metrics.
5. Click the trash icon on an entry &rarr; confirm deletion from Firestore.

### Test Case 8: Settings & Data Hygiene
1. Navigate to **Settings** via the sidebar.
2. Verify authenticated user details (Google name, email, UID).
3. Under Active Dataset Management, click **Clear Dataset** &rarr; verify the dashboard transitions into the empty state prompt.
4. Click **Try Sample Dataset** &rarr; verify instantaneous restoration of enterprise sales data.
5. Click **Sign Out** &rarr; verify session termination and return to the unauthenticated Landing Page.
