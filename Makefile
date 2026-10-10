.PHONY: help destroy clean clean-all status

# Default target
help:
	@echo "======================================================================"
	@echo " Pulumi & MongoDB Cluster Management Makefile"
	@echo "======================================================================"
	@echo " make status    - Check Pulumi stack resources and status"
	@echo " make destroy   - Destroy all AWS Cloud resources (EC2, VPC, etc.)"
	@echo " make clean     - Remove local virtualenv and temporary cache files"
	@echo " make clean-all - Destroy AWS resources AND remove all local caches"
	@echo "======================================================================"

# Check status of Pulumi resources
status:
	@cd pulumi && \
	if [ -d "venv" ]; then \
		. venv/bin/activate && pulumi stack; \
	else \
		pulumi stack; \
	fi

# Destroy AWS Cloud resources to stop billing
destroy:
	@echo "--> Destroying AWS Cloud resources..."
	@cd pulumi && \
	if [ -d "venv" ]; then \
		. venv/bin/activate && pulumi destroy; \
	else \
		pulumi destroy; \
	fi

# Clean local cache, venv, and downloaded plugins (Run AFTER destroy)
clean:
	@echo "--> Cleaning local Python virtual environment (venv)..."
	@rm -rf pulumi/venv
	@echo "--> Cleaning Pulumi local downloaded plugins and caches..."
	@rm -rf ~/.pulumi/plugins/*
	@echo "--> Cleaning Python __pycache__ files..."
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@echo "--> Cleaning Node.js node_modules in test-app..."
	@rm -rf mongodb-cluster/test-app/node_modules
	@echo "Done! Local disk space freed."

# Destroy cloud resources first, then wipe all local cache files
clean-all: destroy clean
	@echo "--> Cleaning Pulumi local stack state..."
	@rm -rf ~/.pulumi/stacks
	@echo "All AWS resources destroyed and all local files cleaned successfully!"

