provider "azurerm" {
  features {}
}

locals {
  resourceGroup = "${var.product}-${var.env}"
  vaultName     = "${var.product}-${var.env}"
}

data "azurerm_key_vault" "opal_key_vault" {
  name                = local.vaultName
  resource_group_name = local.resourceGroup
}

resource "random_string" "session-secret" {
  length = 16
}

resource "random_string" "cookie-secret" {
  length = 16
}

resource "random_string" "csrf-secret" {
  length = 16
}

resource "azurerm_key_vault_secret" "opal-rm-frontend-session-secret" {
  name         = "opal-rm-frontend-session-secret"
  value        = random_string.session-secret.result
  key_vault_id = data.azurerm_key_vault.opal_key_vault.id
}

resource "azurerm_key_vault_secret" "opal-rm-frontend-cookie-secret" {
  name         = "opal-rm-frontend-cookie-secret"
  value        = random_string.cookie-secret.result
  key_vault_id = data.azurerm_key_vault.opal_key_vault.id
}

resource "azurerm_key_vault_secret" "opal-rm-frontend-csrf-secret" {
  name         = "opal-rm-frontend-csrf-secret"
  value        = random_string.csrf-secret.result
  key_vault_id = data.azurerm_key_vault.opal_key_vault.id
}
