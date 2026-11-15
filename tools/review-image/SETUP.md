# Setup — Product Image Process (WR) on CircleCI

This is what Audrey needs to do to make the selectable GitHub work request actually run. Nothing in this folder starts a schedule or creates secrets by itself. GitHub Actions is billing-locked, so the runner lives on CircleCI (free plan). The alternative lane is `ops/self-hosted-ci` on a machine Audrey controls.

## 1. Labels

On [midnghtsapphire/reese-reviews](https://github.com/midnghtsapphire/reese-reviews):

- `image-process` — applied by the **Product Image Process (WR)** issue form when the label exists
- `image-done` — added by the runner after a successful run

If a label is missing, GitHub silently skips it on new issues. Create both under Issues → Labels.

## 2. GitHub token (required for the queue)

Create a fine-grained personal access token (or a classic token) that can:

- read and write Issues on `midnghtsapphire/reese-reviews`
- read and write Contents (so it can push the non-default `review-images` branch)

Do **not** commit the token. In CircleCI, create a [context](https://app.circleci.com/settings/organization) named `image-process` and add:

| Variable | Required | Purpose |
| --- | --- | --- |
| `IMAGE_PROCESS_GITHUB_TOKEN` | yes | GitHub API + push to `review-images` |
| `NOTION_TOKEN` | no | Upload a finished photo when the WR has a Notion page URL |

Then attach that context to the scheduled pipeline (step 4). Project environment variables also work if you would rather not use a context.

The job looks for `IMAGE_PROCESS_GITHUB_TOKEN`, then `GITHUB_TOKEN`, then `GH_TOKEN`.

## 3. Optional Notion token

Same integration as the local CLI (`NOTION_TOKEN`). Grant the integration access to the Amazon Resale Inventory pages (or whichever page you paste on the form). The runner appends the photo and does not remove existing content or invent review text.

## 4. CircleCI schedule (every 15 minutes)

Scheduled pipelines are created in the CircleCI UI or API, not by committing a crontab. This repo only defines the job and the pipeline parameter.

1. Open the reese-reviews project in CircleCI.
2. Project Settings → Triggers (or Product → Triggers) → Add Trigger → Schedule.
3. Branch: `main`.
4. Interval: every 15 minutes (or the closest the plan allows).
5. Pipeline parameter: `run_image_process_queue` = `true` (boolean).
6. Attach the `image-process` context if you created one.

Until this schedule (or a manual / n8n / Zapier trigger) exists, opening a Product Image Process WR will not process anything on its own. You can still run the CLI on your computer.

To run the queue once without waiting:

```bash
# CircleCI personal or project token, not the GitHub token
curl -X POST https://circleci.com/api/v2/project/github/midnghtsapphire/reese-reviews/pipeline \
  -H "Circle-Token: $CIRCLECI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"branch":"main","parameters":{"run_image_process_queue":true}}'
```

## 5. What the queue does

For each open issue labeled `image-process` that does not have `image-done`:

1. Parse the issue form (URL / ASIN or attached image, steps, filter, output presets, optional Notion URL).
2. Run `tools/review-image`.
3. Commit outputs to the non-default branch `review-images`, in a folder `issue-<number>/`. No force-push, no branch deletes.
4. Comment on the issue with the file links, signed **Auky:** … — Auky.
5. If `NOTION_TOKEN` is set and a Notion page URL was given, upload the review photo (existing page content stays).
6. Add the `image-done` label. Failures leave that label off so the issue can be retried.

## Alternative lane: ops/self-hosted-ci

If you would rather not use a CircleCI schedule, run the same queue on a machine you control with the `ops/self-hosted-ci` act dispatcher (the usual substitute while GitHub Actions is billing-locked). On that machine:

```bash
cd tools/review-image
python3 -m pip install -r requirements.txt
export IMAGE_PROCESS_GITHUB_TOKEN=…   # same token as above
export NOTION_TOKEN=…                 # optional
# from a checkout of reese-reviews, on a branch you are allowed to push
PYTHONPATH=. python3 -m review_image.queue
```

Do not set this up as automation on the bot box. Use a machine Audrey controls.

## Using the CLI without the queue

You do not need CircleCI to process a photo on your computer. See the README in this folder.
