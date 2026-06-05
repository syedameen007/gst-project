# Fiscal Lens

React + JavaScript full-stack finance project for tax-aware investments, GST ITC planning, portfolio tax impact, what-if simulation, and AI support chat.

## Features

- Separate React pages for all five requested features.
- Proper home hub at `/` with access to every feature.
- Customer login page at `/login`.
- Sign-up / create account page at `/signup`.
- Google OAuth login scaffold with backend callback at `/api/auth/google/callback`.
- User information and settings page at `/settings`.
- Portfolio creator at `/portfolio-creator` with editable assets, tax buckets, risk mix, and MongoDB save/load.
- Stock prediction and analysis at `/stocks` with direct stock entry, MongoDB storage, ML-assisted projection, and capital-gains tax notes.
- Tax filing helper at `/tax-filing-helper` for document uploads, expense writing, and guided beginner tax questions.
- Responsive web and phone support with mobile bottom navigation.
- MongoDB persistence for user financial profile, scenarios, ML predictions, and chat messages.
- MongoDB persistence for users and created portfolios.
- MongoDB persistence for uploaded document metadata, expenses, and tax guide answers.
- Node/Express API with Mongoose models.
- JavaScript ML training pipeline using ridge regression on online CSV/Kaggle-style OHLCV data.
- Floating AI customer-support chatbot on every page.

## Run Locally

```bash
cp .env.example .env
docker compose up -d
npm install
npm run ml:train
npm run dev
```

Frontend: http://127.0.0.1:5173  
API: http://127.0.0.1:4000/api/health

## Google Login

Create a Google OAuth web client in Google Cloud Console and add this redirect URI:

```text
http://127.0.0.1:4000/api/auth/google/callback
```

Then set these in `.env`:

```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://127.0.0.1:4000/api/auth/google/callback
```

The Login and Sign Up pages both include a Google button. Password signup works without Google credentials.

## Kaggle Training

Kaggle dataset pages require a Kaggle account/API token to download files programmatically. Download any NIFTY 50 OHLCV CSV from Kaggle, then train with:

```bash
$env:TRAINING_CSV_PATH="C:\path\to\nifty50.csv"
npm run ml:train
```

The trainer expects columns like `Date`, `Open`, `High`, `Low`, `Close`, and `Volume`. It saves the trained model artifact at:

```text
server/ml/trainedModel.json
```

Without a Kaggle CSV, `npm run ml:train` uses a public online OHLCV CSV so the ML path works immediately. Replace it with a NIFTY dataset for a stronger India-specific model.

## Accuracy Note

Income-tax and GST savings are deterministic calculations based on encoded tax rules. Portfolio growth is probabilistic; accuracy improves only when the ML model is trained and validated on relevant historical NIFTY/portfolio data.

## Filing Helper

The filing helper stores uploaded files in local `uploads/` and stores metadata in MongoDB. The folder is ignored by Git so real user documents are not pushed to GitHub.

Users can:

- upload Form 16, GST invoices, investment proofs, bank statements, rent/home-loan documents, and expense bills
- enter business expenses with GST amount and tax treatment
- answer guided questions that generate a filing checklist for beginners

## Stock Analysis

The stock analysis page lets users add holdings directly with symbol, quantity, buy/current price, recent return signals, volatility, volume ratio, holding period, and tax class. Each saved holding is stored in MongoDB and returned with ML-assisted price projection plus a tax-aware short-term/long-term capital-gains note.
