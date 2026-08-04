# server-side-cms-key-protection Specification

## Purpose
TBD - created by archiving change legacy-frontend-content-gateway. Update Purpose after archive.
## Requirements
### Requirement: CMS Credentials Are Server-Only
The system MUST keep `CMS_API_KEY` and related CMS credentials exclusively in gateway runtime configuration and SHALL never expose them in browser bundles or public API responses.

#### Scenario: Browser payload does not contain CMS key
- **WHEN** a user loads any public page and inspects network traffic and JavaScript assets
- **THEN** no value of `CMS_API_KEY` or equivalent CMS credential is present

#### Scenario: Gateway uses secret to call CMS
- **WHEN** the gateway executes a content fetch against the external GraphQL CMS
- **THEN** it sends the CMS credential only in the server-side upstream request path

### Requirement: Missing Secret Fails Fast
The gateway SHALL validate required CMS environment variables at startup and MUST fail startup with a clear error when required values are missing.

#### Scenario: Startup validation rejects missing key
- **WHEN** the gateway starts without `CMS_API_KEY`
- **THEN** startup fails and logs a configuration error indicating the missing variable

