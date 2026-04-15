# Complete Keycloak Setup Script
# Creates realm, client, roles, and users for JungleInEnglish application

$KEYCLOAK_URL = "http://localhost:8180"
$ADMIN_USERNAME = "admin"
$ADMIN_PASSWORD = "admin"
$REALM = "myrealm"

Write-Host "=== Keycloak Complete Setup ===" -ForegroundColor Cyan
Write-Host "Keycloak URL: $KEYCLOAK_URL" -ForegroundColor Gray
Write-Host "Realm: $REALM" -ForegroundColor Gray
Write-Host ""

# Step 1: Get admin access token
Write-Host "[1/5] Getting admin access token..." -ForegroundColor Yellow
try {
    $tokenResponse = Invoke-RestMethod -Method Post -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" -ContentType "application/x-www-form-urlencoded" -Body @{
        grant_type="password"
        client_id="admin-cli"
        username=$ADMIN_USERNAME
        password=$ADMIN_PASSWORD
    }
    $adminToken = $tokenResponse.access_token
    Write-Host "SUCCESS: Admin token obtained" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to get admin token. Is Keycloak running on port 8180?" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Create realm
Write-Host ""
Write-Host "[2/5] Creating realm '$REALM'..." -ForegroundColor Yellow
$realmBody = @{
    realm = $REALM
    enabled = $true
    displayName = "Jungle in English"
    registrationAllowed = $true
    loginTheme = "keycloak"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Method Post -Uri "$KEYCLOAK_URL/admin/realms" -Headers @{Authorization="Bearer $adminToken"; "Content-Type"="application/json"} -Body $realmBody | Out-Null
    Write-Host "SUCCESS: Realm '$REALM' created" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "WARNING: Realm already exists" -ForegroundColor Yellow
    } else {
        Write-Host "ERROR: Failed to create realm: $_" -ForegroundColor Red
    }
}

# Step 3: Create client
Write-Host ""
Write-Host "[3/5] Creating client 'jungle-web'..." -ForegroundColor Yellow
$clientBody = @{
    clientId = "jungle-web"
    name = "Jungle Web Application"
    enabled = $true
    publicClient = $true
    directAccessGrantsEnabled = $true
    standardFlowEnabled = $true
    implicitFlowEnabled = $false
    serviceAccountsEnabled = $false
    redirectUris = @("http://localhost:4200/*", "http://localhost:4200")
    webOrigins = @("http://localhost:4200")
    attributes = @{
        "post.logout.redirect.uris" = "http://localhost:4200/*"
    }
} | ConvertTo-Json -Depth 3

try {
    Invoke-RestMethod -Method Post -Uri "$KEYCLOAK_URL/admin/realms/$REALM/clients" -Headers @{Authorization="Bearer $adminToken"; "Content-Type"="application/json"} -Body $clientBody | Out-Null
    Write-Host "SUCCESS: Client 'jungle-web' created" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "WARNING: Client already exists" -ForegroundColor Yellow
    } else {
        Write-Host "ERROR: Failed to create client: $_" -ForegroundColor Red
    }
}

# Step 4: Create roles
Write-Host ""
Write-Host "[4/5] Creating roles..." -ForegroundColor Yellow
$roles = @("admin", "teacher", "tutor", "student")

foreach ($roleName in $roles) {
    $roleBody = @{
        name = $roleName
        description = "Role for $roleName users"
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Method Post -Uri "$KEYCLOAK_URL/admin/realms/$REALM/roles" -Headers @{Authorization="Bearer $adminToken"; "Content-Type"="application/json"} -Body $roleBody | Out-Null
        Write-Host "  SUCCESS: Role '$roleName' created" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode -eq 409) {
            Write-Host "  WARNING: Role '$roleName' already exists" -ForegroundColor Yellow
        } else {
            Write-Host "  ERROR: Failed to create role '$roleName': $_" -ForegroundColor Red
        }
    }
}

# Step 5: Create users
Write-Host ""
Write-Host "[5/5] Creating users..." -ForegroundColor Yellow

$users = @(
    @{username="admin"; email="admin@jungle.com"; firstName="Admin"; lastName="User"; password="admin123"; role="admin"},
    @{username="teacher"; email="teacher@jungle.com"; firstName="Teacher"; lastName="User"; password="teacher123"; role="teacher"},
    @{username="tutor"; email="tutor@jungle.com"; firstName="Tutor"; lastName="User"; password="tutor123"; role="tutor"},
    @{username="student"; email="student@jungle.com"; firstName="Student"; lastName="User"; password="student123"; role="student"}
)

function Create-UserWithRole {
    param($userData)
    
    $userBody = @{
        username = $userData.username
        email = $userData.email
        firstName = $userData.firstName
        lastName = $userData.lastName
        enabled = $true
        emailVerified = $true
        credentials = @(
            @{
                type = "password"
                value = $userData.password
                temporary = $false
            }
        )
    } | ConvertTo-Json -Depth 3
    
    try {
        Invoke-RestMethod -Method Post -Uri "$KEYCLOAK_URL/admin/realms/$REALM/users" -Headers @{Authorization="Bearer $adminToken"; "Content-Type"="application/json"} -Body $userBody | Out-Null
        
        $user = (Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/users?username=$($userData.username)" -Headers @{Authorization="Bearer $adminToken"})[0]
        
        $role = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/roles/$($userData.role)" -Headers @{Authorization="Bearer $adminToken"}
        
        $roleMapping = @(
            @{
                id = $role.id
                name = $role.name
            }
        ) | ConvertTo-Json
        
        Invoke-RestMethod -Method Post -Uri "$KEYCLOAK_URL/admin/realms/$REALM/users/$($user.id)/role-mappings/realm" -Headers @{Authorization="Bearer $adminToken"; "Content-Type"="application/json"} -Body $roleMapping | Out-Null
        
        Write-Host "  SUCCESS: User '$($userData.username)' created with role '$($userData.role)' (password: $($userData.password))" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode -eq 409) {
            Write-Host "  WARNING: User '$($userData.username)' already exists" -ForegroundColor Yellow
        } else {
            Write-Host "  ERROR: Failed to create user '$($userData.username)': $_" -ForegroundColor Red
        }
    }
}

foreach ($user in $users) {
    Create-UserWithRole -userData $user
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now login with:" -ForegroundColor White
Write-Host "  Admin:   admin / admin123" -ForegroundColor Gray
Write-Host "  Teacher: teacher / teacher123" -ForegroundColor Gray
Write-Host "  Tutor:   tutor / tutor123" -ForegroundColor Gray
Write-Host "  Student: student / student123" -ForegroundColor Gray
Write-Host ""
$consoleUrl = "$KEYCLOAK_URL/admin"
Write-Host "Keycloak Console: $consoleUrl" -ForegroundColor Gray
