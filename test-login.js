// Native fetch is available in Node 18+

const keycloakBaseUrl = "https://account.des.aureaphigital.com:8443";
const realm = "des-aureaphigital";
const clientId = "appmob_artemis_des_password_credential";

const uranusApiUrl = "https://gateway.des.aureaphygital.com.br/uranus";
const masterTenant = "des-aureaphigital";

async function testLogin(username, password) {
    console.log(`\n--- Testando Login no Keycloak + Uranus ---`);
    console.log(`URL Keycloak: ${keycloakBaseUrl}`);
    console.log(`URL Uranus: ${uranusApiUrl}`);

    const tokenParams = new URLSearchParams();
    tokenParams.append("client_id", clientId);
    tokenParams.append("grant_type", "password");
    tokenParams.append("username", username);
    tokenParams.append("password", password);
    tokenParams.append("scope", "openid profile email");

    try {
        console.log("1. Autenticando no Keycloak...");
        const response = await fetch(
            `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/token`,
            {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: tokenParams,
            }
        );

        const data = await response.json();

        if (response.ok) {
            console.log("   [OK] Token recebido!");

            // FETCH USER INFO
            console.log("\n2. Buscando User Info (Keycloak)...");
            const userInfoResponse = await fetch(
                `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/userinfo`,
                {
                    headers: { "Authorization": `Bearer ${data.access_token}` }
                }
            );
            const userInfo = await userInfoResponse.json();
            console.log("   [OK] User Info:", JSON.stringify(userInfo, null, 2));

            // FETCH URANUS DATA
            const uranusUsername = userInfo.preferred_username || username;
            console.log(`\n3. Buscando dados no Uranus para: ${uranusUsername}...`);

            const uranusResponse = await fetch(
                `${uranusApiUrl}/core/users/${uranusUsername}`,
                {
                    headers: {
                        "Authorization": `Bearer ${data.access_token}`,
                        "X-Tenant": masterTenant,
                        "Content-Type": "application/json"
                    }
                }
            );

            if (uranusResponse.ok) {
                const uranusData = await uranusResponse.json();
                console.log("   [OK] Uranus Data RAW:", JSON.stringify(uranusData, null, 2));

                // SIMULATE EXTRACTION LOGIC
                const userData = uranusData.data || uranusData;
                const extractedTenant = userData.tenant || (userData.attributes && userData.attributes.tenant ? userData.attributes.tenant[0] : null);

                console.log("\n--- RESULTADO DA EXTRAÇÃO ---");
                console.log(`TENANT IDENTIFICADO: ${extractedTenant ? extractedTenant : "NÃO ENCONTRADO (NULL)"}`);

                if (!extractedTenant) {
                    console.log("Dica: Verifique se o tenant vem dentro de 'groups' ou 'attributes' no JSON acima.");
                }

            } else {
                console.error("   [ERRO Uranus]", uranusResponse.status, await uranusResponse.text());
            }

        } else {
            console.error("\n[ERRO LOGIN]", response.status, JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error("\n[ERRO DE CONEXAO]", error);
    }
}

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log("Uso: node test-login.js <usuario> <senha>");
} else {
    testLogin(args[0], args[1]);
}
