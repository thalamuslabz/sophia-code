# Custom Open WebUI image with Graphviz support
# Extends the official Open WebUI image with system dependencies for diagram generation tools

FROM ghcr.io/open-webui/open-webui:main

USER root

# Install Graphviz and its dependencies
RUN apt-get update && apt-get install -y \
    graphviz \
    libgraphviz-dev \
    && rm -rf /var/lib/apt/lists/*

# Verify installation
RUN dot -V

# Switch back to the default user
USER $UID
