Azure DevOps deployment notes

This document explains how to set up an Azure DevOps pipeline to build, push images to Azure Container Registry (ACR), and deploy a multi-container App Service using the included `azure-pipelines.yml`.

Required Azure resources / service connections

1. Create an Azure Resource Manager service connection in Azure DevOps (name it `AzureServiceConnection` or change the YAML to your name). This allows the pipeline to run `az` commands and create/update App Service.

2. Create a Docker Registry service connection for your ACR (name it `ACRServiceConnection` or change the YAML). This is used by the `Docker@2` task to push images.

Pipeline variables (set these at pipeline or variable group level):
- `ACR_NAME` — your ACR name (example: `myacr12345`)
- `RESOURCE_GROUP` — resource group to create/modify (example: `myResourceGroup`)
- `APP_SERVICE_PLAN` — App Service plan name (example: `myAppPlan`)
- `WEBAPP_NAME` — Web App name (example: `my-multiapp`)
- `VITE_API_URL` — frontend API base URL (used as build-arg when building frontend image)

How the pipeline works

- `BuildAndPush` stage uses `Docker@2` to build the backend and frontend images and push them to ACR with tag `$(Build.BuildId)`.
- `Deploy` stage uses `AzureCLI@2` to:
  - ensure resource group and app service plan exist,
  - create the Web App (if missing),
  - configure the Web App to use the `docker-compose.yml` from the repo (multi-container), passing ACR credentials so App Service can pull private images.

Notes and troubleshooting

- Make sure `docker-compose.yml` references images using `$(ACR_NAME).azurecr.io/...` as done in the repo or update it accordingly.
- If App Service cannot pull images, confirm ACR credentials and that the ACR and Web App are in the same subscription (or grant pull permissions to the Web App's managed identity).
- You may need to open Networking/Access controls in the Portal for ACR if you use firewall rules.

Next steps I can help with:
- Customize the pipeline to use image tags like `latest` or git SHA.
- Add automatic slot swap or health checks.
- Configure pipeline secrets and variable groups for better secrets management.
