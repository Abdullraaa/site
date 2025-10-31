
# UN533N Deployment Guide (Hostinger)

1.  **Set up Hostinger account:** Choose a plan that supports Node.js.
2.  **Configure environment:** Use Hostinger's hPanel to set up environment variables for the database, API keys, etc. You will need to create a `.env` file in the `backend` directory with the following variables:

    ```
    DB_HOST=
    DB_USER=
    DB_PASSWORD=
    DB_NAME=
    ```

3.  **Connect Git repository:** Link your GitHub repository to Hostinger for automated deployments.
4.  **Build and deploy:** Configure a CI/CD pipeline (e.g., using GitHub Actions) to automatically build and deploy the Next.js and Node.js apps.
5.  **Domain and SSL:** Point your domain to Hostinger and enable SSL.
