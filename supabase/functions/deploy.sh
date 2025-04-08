#!/bin/bash

# Deploy de todas as funções Edge do Supabase
# É necessário ter o Supabase CLI instalado

# Deploy da função webhook-kiwify
echo "Deploying webhook-kiwify..."
supabase functions deploy webhook-kiwify --project-ref your-project-ref

# Deploy da função salvar-plano
echo "Deploying salvar-plano..."
supabase functions deploy salvar-plano --project-ref your-project-ref

echo "Deploy completed!" 