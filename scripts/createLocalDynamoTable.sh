aws dynamodb create-table \
    --endpoint-url http://localhost:8000 \
    --table-name UserAuthentication-test \
    --attribute-definitions AttributeName=username,AttributeType=S \
    --key-schema AttributeName=username,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

