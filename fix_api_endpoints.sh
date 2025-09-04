#!/bin/bash

# Fix API endpoints in Users.js
echo "Fixing API endpoints in Users.js..."

# Fix all API endpoints to include /api prefix
sed -i '' 's|api\.get(`/users|api.get(`/api/users|g' client/src/pages/Users.js
sed -i '' 's|api\.post(`/users|api.post(`/api/users|g' client/src/pages/Users.js
sed -i '' 's|api\.put(`/users|api.put(`/api/users|g' client/src/pages/Users.js
sed -i '' 's|api\.delete(`/users|api.delete(`/api/users|g' client/src/pages/Users.js

# Fix the stats endpoint
sed -i '' 's|/users/stats/overview|/api/users/stats/overview|g' client/src/pages/Users.js

echo "API endpoints fixed!"
echo "Verifying changes..."

# Show all API calls
echo "API calls found:"
grep -n "api\.(get|post|put|delete).*users" client/src/pages/Users.js 2>/dev/null || echo "No regex matches found, checking individually..."

echo "Individual API calls:"
grep -n "api\.get.*users" client/src/pages/Users.js
grep -n "api\.post.*users" client/src/pages/Users.js
grep -n "api\.put.*users" client/src/pages/Users.js
grep -n "api\.delete.*users" client/src/pages/Users.js
