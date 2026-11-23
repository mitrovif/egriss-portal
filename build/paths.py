# Folders outside this repository that the build reads. Set them in paths.local.json (not committed) or as
# environment variables PORTAL_GAIN_STORY, PORTAL_SDG, PORTAL_IDQ, PORTAL_BANK, PORTAL_ROSTER.
import json, os
_H = os.path.dirname(os.path.abspath(__file__))
_f = os.path.join(_H, "paths.local.json")
_P = json.load(open(_f)) if os.path.exists(_f) else {}
def path(key, required=True):
    v = os.environ.get("PORTAL_" + key.upper()) or _P.get(key)
    if not v:
        if required: raise SystemExit("Set '%s' in build/paths.local.json (see paths.example.json)" % key)
        return ""
    return os.path.expanduser(v)
