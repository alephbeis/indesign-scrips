# Fix macOS permissions for InDesign scripts (Automation, Accessibility)

This guide helps you resolve permission-related errors when InDesign scripts try to bring a PDF viewer to the front or perform other app-to-app actions on macOS.

Common example error (seen when using System Events UI scripting):

- Error Number: -10006
- Error String: System Events got an error: Can't set process "Preview" to true.

Why this happens:
- macOS protects inter‑app control behind Privacy & Security permissions.
- Two relevant categories:
  - Accessibility: needed for UI scripting via System Events (manipulating app UIs).
  - Automation (Apple Events): needed to send Apple Events like `activate` to apps such as Preview/Acrobat.
- If permission is missing or previously denied, scripts that change focus or open viewers may fail.

Note: The current repository prefers Apple Events (e.g., `tell application id "com.apple.Preview" to activate`) which avoids needing Accessibility. You still need Automation permission for InDesign to control Preview/Acrobat.

---

## Quick checklist (do this first)

1) Ensure target app is installed and can open a PDF manually
- Preview or Adobe Acrobat/Reader should be available on the machine.

2) Try again so macOS can prompt for permission
- Quit InDesign completely, reopen, run the export again, and watch for the macOS prompts.
- Click “OK” or “Allow” when macOS asks to allow Adobe InDesign to control Preview, System Events, or Acrobat.

3) Verify the viewer opens if you double-click the exported PDF
- If the PDF opens fine manually, the export succeeded; the remaining issue is likely just window activation permissions.

---

## Grant Automation permission (Apple Events)

macOS Ventura/Sonoma (System Settings):

1. Open System Settings → Privacy & Security → Automation.
2. Find “Adobe InDesign” in the list.
3. Enable the toggles for:
   - System Events (if present)
   - Preview
   - Adobe Acrobat and/or Adobe Acrobat Reader (if present)
4. If these entries are missing, re-run the script to trigger prompts.

Older macOS (System Preferences):
- System Preferences → Security & Privacy → Privacy tab → Automation → Adobe InDesign → enable Preview/Acrobat/System Events.

---

## Grant Accessibility (only needed for UI scripting)

Most scripts in this repo no longer require Accessibility. However, if you run older scripts that use System Events UI scripting, grant this too:

macOS Ventura/Sonoma:
1. System Settings → Privacy & Security → Accessibility.
2. Ensure “Adobe InDesign” is ON. If missing, click “+”, add Adobe InDesign.app from Applications, then enable it.

Older macOS:
- System Preferences → Security & Privacy → Privacy → Accessibility → enable Adobe InDesign.

---

## Reset permissions (if you previously clicked “Don’t Allow”)

If Automation/Accessibility prompts don’t appear, or toggles are stuck, reset the privacy database for InDesign.

1. Quit Adobe InDesign.
2. Open Terminal and run the following commands (you may be prompted for an admin password):

```bash
# Reset Apple Events (Automation) grants for InDesign
tccutil reset AppleEvents com.adobe.InDesign

# Reset Accessibility grants for InDesign (only needed if you use UI scripting)
tccutil reset Accessibility com.adobe.InDesign
```

3. Reopen InDesign and run your export again. Approve any prompts shown by macOS.

---

## Company-managed Macs (MDM)

- Some organizations block Apple Events/Automation or Accessibility via MDM policies.
- If Automation toggles are greyed out or revert after enabling, contact IT and request:
  - Allow Adobe InDesign to send Apple Events to Preview, System Events, Adobe Acrobat, and Adobe Acrobat Reader.
  - Allow Adobe InDesign in Accessibility if legacy UI scripting is required.

Provide them with the bundle IDs:
- InDesign: com.adobe.InDesign
- Preview: com.apple.Preview
- Adobe Acrobat Pro: com.adobe.Acrobat
- Adobe Acrobat Reader: com.adobe.Reader
- System Events: com.apple.systemevents

---

## Verifying the fix

After granting permissions:

1) Export a PDF again using the repository’s ExportPDF.jsx.
2) If “View PDF after export” is enabled, the script will try to activate the PDF viewer via Apple Events.
3) Expected behavior:
   - The export completes successfully.
   - The selected PDF viewer (Preview/Acrobat) comes to the front.

If activation still doesn’t occur but the PDF is exported:
- The Automation permission may still be blocked by policy.
- As a workaround, open the exported PDF manually (Launch Services will choose the default viewer).

---

## Windows note

- Windows does not use macOS Automation/Accessibility. The repo uses a best‑effort `AppActivate("Adobe")` PowerShell call for Acrobat/Reader. If that does not bring Acrobat to front, the PDF still exports successfully; open it manually or ensure Acrobat is running.

---

## Troubleshooting tips

- Make sure the script is up to date (this repo replaced UI scripting with Apple Events for viewer activation).
- Try toggling the “View PDF after export” option off to confirm that only the viewer activation is affected.
- If Preview is not installed or was removed from /System/Applications, activation will fail—use Acrobat or another PDF app.
- For stubborn cases, reboot after resetting TCC (tccutil) and re-try.

---

## Summary

- Prefer Apple Events activation: fewer permissions and more reliable across macOS versions.
- Ensure Automation permissions for InDesign → Preview/Acrobat are enabled.
- If you used older scripts that relied on UI scripting, also enable Accessibility or update to the latest scripts in this repo.
