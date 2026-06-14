# Deployment Guide

FlowChat is designed to run as containerized services behind Nginx.

## Services

- `frontend` serves the React application as static assets.
- `backend` serves REST APIs, uploaded files, and Socket.IO.
- `mongodb` stores application data.
- `nginx` routes browser traffic to frontend and backend services.

## Production Checklist

- Replace all default secrets.
- Use a managed MongoDB cluster or encrypted persistent volume.
- Configure HTTPS at the load balancer or Nginx layer.
- Restrict CORS to trusted origins.
- Enable persistent object storage for uploads.
- Configure centralized logging and monitoring.
- Run tests in CI before deployment.

