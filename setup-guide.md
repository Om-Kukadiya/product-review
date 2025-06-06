# Shopify Product Review App - Production Setup

A Shopify app built with React, Remix, Shopify GraphQL Admin API, and Polaris components for managing product reviews.

## Features

### Admin Panel
- View products and manage reviews
- Add, edit, delete reviews in popup interface
- Sort and filter reviews

### Storefront
- Display reviews on product pages using app blocks
- Show reviewer name, star rating, and comment
- Reviews on collection pages

### Storage
- Reviews stored in MySQL database

## Tech Stack
- **Framework**: React + Remix
- **Authentication**: Shopify OAuth
- **API**: Shopify GraphQL Admin API
- **UI**: Shopify Polaris
- **Database**: MySQL

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Shopify Partner account
- Production server with SSL
- MySQL database

## Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/your-username/shopify-product-review-app.git
cd shopify-product-review-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create `.env` file:
```
NODE_ENV=production
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret
SCOPES=write_products,read_products,write_script_tags,read_script_tags
HOST=https://your-domain.com
DATABASE_URL=mysql://user:password@host:port/database_name
```

### 4. Database Setup
Create database tables using Prisma:
```bash
npx prisma db push
```

### 5. Build Application
```bash
npm run build
```

### 6. Start Application
```bash
npm run start
```

## Deployment Steps

### 1. Server Setup
- Set up production server (Ubuntu/CentOS)
- Install Node.js v16+
- Install MySQL
- Configure SSL certificate
- Set up domain name

### 2. Database Configuration
- Create MySQL database
- Configure database user and permissions
- Update DATABASE_URL in environment variables

### 3. Application Deployment
- Upload code to server
- Install dependencies
- Set environment variables
- Run database setup
- Build and start application

### 4. Process Management
Install PM2 for production:
```bash
npm install -g pm2
pm2 start npm --name "shopify-app" -- start
pm2 startup
pm2 save
```

## Shopify App Configuration

1. In Shopify Partner dashboard, create new app
2. Set App URL: `https://your-domain.com`
3. Set Redirection URL: `https://your-domain.com/auth/callback`
4. Install app on development store
5. Grant required scopes

## Admin Setup

### 1. Install the App
- In Shopify Admin, go to **Apps** and install the Product Review App

### 2. Create Account
- Enter username and email to register upon first access

### 3. Configure App Settings
- Navigate to Configuration page
- Set display style (Grid/List)
- Set number of reviews to display per page
- Enable/disable app features
- Click **Save** to apply settings

### 4. Manage Reviews
- Go to **Products** page in the app
- View list of all products from your store
- Click **View Reviews** for any product
- Popup displays all reviews for selected product
- **Add Review**: Click **Insert New Rating**, fill details (star rating, name, email, comment), save
- **Edit Review**: Click edit button on existing review, modify details, save
- **Delete Review**: Click delete button to remove review

### 5. Enable Collection Page Reviews
- Go to **Customization** section in app
- Toggle **Embed App** option for collections
- Reviews will display on collection pages

### 6. Add App Block to Product Pages
- In Shopify Admin: **Online Store** > **Themes**
- Click **Customize** on active theme
- Navigate to product page template
- In left sidebar, find **Apps** section
- Click **Add block** and select **Product Review App**
- Drag to desired position on product page
- Click **Save**

## Usage
- **Admin Panel**: Access via Shopify Admin > Apps
- **Storefront**: Reviews display on product and collection pages

## Troubleshooting
- Verify environment variables are correct
- Check database connection
- Confirm Shopify API credentials in Partner dashboard