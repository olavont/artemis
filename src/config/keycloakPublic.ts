// Public (non-secret) Keycloak/Uranus configuration.
// NOTE: In Lovable published apps, Vite env (import.meta.env) may not be available.
// These values are safe to ship to the client.

export const KEYCLOAK_BASE_URL = "https://account.des.aureaphigital.com:8443";
export const KEYCLOAK_REALM = "des-aureaphigital";
export const KEYCLOAK_CLIENT_ID = "appmob_artemis_des_password_credential";

export const URANUS_API_URL = "https://gateway.des.aureaphygital.com.br/uranus";
export const URANUS_MASTER_TENANT = "des-aureaphigital";
