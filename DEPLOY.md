# Deploying GoldTrader Pro to Render.com

This guide provides step-by-step instructions to host your full-stack trading application on **Render.com** for free.

---

## Deployment Architecture

```mermaid
graph TD
    User([Browser Client]) -->|Loads HTML/CSS/JS| FE[Render Static Site: Frontend]
    User -->|Sends API requests| BE[Render Web Service: Backend API]
    BE -->|Queries & Updates| DB[(Render Managed PostgreSQL)]
```

---

## Step 1: Provision the PostgreSQL Database

1. Go to your **[Render Dashboard](https://dashboard.render.com/)** and log in.
2. Click **New** (top right) and select **PostgreSQL**.
3. Fill in the database details:
   - **Name**: `goldtrader-db`
   - **Database Name**: `goldtrader`
   - **User**: `postgres` (or leave default)
   - **Region**: Choose the region closest to you or your target users.
   - **Instance Type**: Select the **Free** tier.
4. Click **Create Database**.
5. Once active, note the **Internal Database URL** (e.g., `postgres://user:password@internal-host:5432/goldtrader`). You will need this for the backend.

---

## Step 2: Deploy the Backend API Web Service

1. On the Render dashboard, click **New** -> **Web Service**.
2. Select your Git repository.
3. Configure the following service settings:
   - **Name**: `goldtrader-backend`
   - **Environment**: `Node`
   - **Region**: Select the same region as your database (for minimal latency).
   - **Root Directory**: `backend` *(Crucial: This tells Render to run commands inside the `backend` subdirectory)*
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: **Free**
4. Expand the **Advanced** section and click **Add Environment Variable** to add the following variables:
   
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `DATABASE_URL` | *Your Internal Database URL* | From Step 1 |
   | `JWT_SECRET` | *Generates a secure secret string* | e.g. `your-super-secret-key-1234` |
   | `NODE_ENV` | `production` | Enables production settings |
   | `PORT` | `10000` | Render's default web service port |

5. Click **Create Web Service**. 
6. Wait for the build and deployment logs to say `Connected to PostgreSQL and synced tables successfully`.
7. Copy the service's live URL (e.g., `https://goldtrader-backend.onrender.com`).

---

## Step 3: Deploy the Frontend Static Site

1. On the Render dashboard, click **New** -> **Static Site**.
2. Select your Git repository.
3. Configure the following service settings:
   - **Name**: `goldtrader-frontend`
   - **Root Directory**: Leave blank (root folder `/`)
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Expand the **Advanced** section and click **Add Environment Variable**:

   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | *Your live Backend URL* | From Step 2 (e.g., `https://goldtrader-backend.onrender.com`) |

5. Click **Create Static Site**.
6. Render will build the Vite project and host it on a global CDN.
7. Open the generated frontend URL to access your live website!

---

## Troubleshooting & Tips

- **Free Tier Sleep**: Render's free tier Web Services spin down (sleep) after 15 minutes of inactivity. When a user first opens the frontend, it might take 30–50 seconds for the backend API to wake up. This is normal behavior for free hosting.
- **SSL / HTTPS**: Render automatically provisions free custom SSL certificates for both your backend API and frontend static site.
- **Custom Domains**: You can add your own domain (e.g., `www.yourwebsite.com`) directly from the settings tab of your static site service.
