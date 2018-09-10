# Building the images

Elasticsearch:

```
# Automatically reads AWS credentials for image
yarn deploy-elasticsearch-image 1.x
```

Kibana:

```
# Builds the image directly
bin/deploy_component_image.sh kibana 1.x
```