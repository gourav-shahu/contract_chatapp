This document shows steps to deploy the app to Azure App Service using Docker (multi-container using `docker-compose`).

Prerequisites
- Azure CLI installed and logged in: `az login`
- An Azure subscription where you can create resources
- (Optional) Azure Container Registry (ACR) to push images

Option A — Deploy with Azure App Service using local docker-compose (quick)
1. From repository root, ensure `backend/.env` and `frontend/.env` are configured (no secrets in repo).
2. Build and test locally:

```powershell
# from repo root
docker-compose build
docker-compose up
```

3. Create resource group and app plan:

```powershell
$RG="myResourceGroup"
$PLAN="myAppPlan"
$WEBAPP="my-multiapp"
az group create --name $RG --location eastus
az appservice plan create --name $PLAN --resource-group $RG --is-linux --sku S1
```

4. Create the Web App with the docker-compose file. This command uploads your `docker-compose.yml` to the App Service configuration and deploys it.

```powershell
az webapp create --resource-group $RG --plan $PLAN --name $WEBAPP --multicontainer-config-type compose --multicontainer-config-file ./docker-compose.yml
```

5. Set any needed app settings (environment variables) in Azure Portal or via CLI. For example, to set secrets for the backend use `az webapp config appsettings set`.

```powershell
az webapp config appsettings set --resource-group $RG --name $WEBAPP --settings "MICROSOFT_CLIENT_SECRET=your-secret"
```

6. Open the site: `https://<your-webapp>.azurewebsites.net` (frontend served on root, backend at `/api` or direct port if not proxied).

Notes: 
- App Service will build the images from your Dockerfiles on the Azure host. If builds require private resources or take long, consider pushing images to ACR and referencing them instead.

Option B — Build images, push to Azure Container Registry (recommended for CI/CD)
1. Create an ACR and log in:

```powershell
$ACR_NAME="myacr12345"
az acr create --resource-group $RG --name $ACR_NAME --sku Standard
az acr login --name $ACR_NAME
```

2. Build and push images (example tags):

```powershell
# Backend
docker build -t $ACR_NAME.azurecr.io/contract-chat-backend:latest ./backend
docker push $ACR_NAME.azurecr.io/contract-chat-backend:latest

# Frontend
docker build -t $ACR_NAME.azurecr.io/contract-chat-frontend:latest ./frontend
docker push $ACR_NAME.azurecr.io/contract-chat-frontend:latest
```

3. Update `docker-compose.yml` to use the pushed images (or create a new `docker-compose.acr.yml`) and deploy via the `az webapp create` command similar to Option A, or configure the Web App to use those images.

GitHub Actions
- There's a sample workflow in `.github/workflows/azure-container-deploy.yml` that builds images, pushes to ACR, and triggers deployment. You will need to add Azure credentials to repository secrets.

Azure DevOps
- There's a sample Azure DevOps pipeline available at `azure-pipelines.yml` that builds images, pushes to ACR, and deploys the compose to App Service. See `azure-devops.md` for instructions about creating Azure service connections and pipeline variables.

Troubleshooting
- If App Service fails to build, check the App Service logs in the Azure Portal > Container settings > Logs. You can also `az webapp log tail`.
- CORS: Make sure your `CORS_ORIGINS` in backend are set to your deployed frontend domain.

If you want, I can:
- Add a GitHub Actions workflow that builds/pushes and deploys automatically (requires your ACR / Web App names and secrets).
- Configure nginx to proxy API requests and run the frontend with the backend under the same origin.
