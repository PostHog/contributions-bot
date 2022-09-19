module.exports = addContributor

const getUserDetails = require('./get-user-details')
const ContentFiles = require('./modules/content-files')

async function addContributor({
    context,
    commentReply,
    repository,
    config,
    who,
    contributions,
    branchName,
    pullRequestUrl,
    contributorEmail,
    isCodeContribution,
}) {
    // get user information
    const { id, login, name, avatar_url, profile } = await getUserDetails({
        octokit: context.octokit,
        username: who,
    })

    let merchNotification = ''

    if (isCodeContribution) {
        if (contributorEmail) {
            const emailComponents = contributorEmail.split('@')
            const maskedEmail = `${emailComponents[0].slice(0, 2)}*******@${emailComponents[1].slice(0, 2)}*******.***`
            merchNotification = `@${who} As a thank you, we sent you an email at ${maskedEmail} with a voucher for [our merch](https://merch.posthog.com/)! If you don't have access to that inbox, message hey@posthog.com and we'll sort something out. If you have a moment, we'd also love to know [what you think about PostHog!](https://www.g2.com/g2gives/girls-who-code-pillar-2022/and/posthog)`
        } else {
            merchNotification = `@${who} As a thank you, we'd like to gift you a voucher for [our merch](https://merch.posthog.com/) – just email hey@posthog.com to get it! If you have a moment, we'd also love to know [what you think about PostHog!](https://www.g2.com/g2gives/girls-who-code-pillar-2022/and/posthog)
      `
        }
    }

    if (config.isContributorWithRequestedContributionTypeAlreadyExists({ login: who, contributions })) {
        if (commentReply) {
            let message = merchNotification
                ? merchNotification
                : `@${who} already contributed before to ${contributions.join(', ')}`
            commentReply.reply(message)
        }

        return {}
    }

    // add user to configuration
    await config.addContributor({
        login: who,
        contributions,
        name,
        avatar_url,
        profile,
    })

    // fetch all files that are configured in .all-contributors.rc ("files" key)
    const contentFiles = new ContentFiles({
        repository,
    })

    await contentFiles.fetch(config)
    if (config.getOriginalSha() === undefined) {
        contentFiles.init()
    }
    contentFiles.generate(config)
    const filesByPathToUpdate = contentFiles.get()

    // add the `.all-contributorsrc` config file to list of files to update in PR
    filesByPathToUpdate[config.getPath()] = {
        content: config.getRaw(),
        originalSha: config.getOriginalSha(),
    }

    // PostHog:main or :master
    const requestOriginExplanation = commentReply
        ? `This was requested by ${commentReply.replyingToWho()} [in this comment](${commentReply.replyingToWhere()})`
        : `This is an automatic action triggered by the merging of [this PR](${pullRequestUrl}).`

    // create or update pull request
    const { pullRequestURL, pullCreated } = await repository.createPullRequestFromFiles({
        title: `chore(contributors): 🤖 - Add ${who} as a contributor 🎉`,
        body: `Adds @${who} as a contributor for ${contributions.join(
            ', '
        )}.\n\n${requestOriginExplanation}\n\n${merchNotification}`,
        filesByPath: filesByPathToUpdate,
        branchName,
    })

    // let user know in comment
    const message = pullCreated
        ? `I've put up [a pull request](${pullRequestURL}) to add @${who}! :tada:`
        : `I've updated [the pull request](${pullRequestURL}) to add @${who}! :tada:`

    if (commentReply) {
        commentReply.reply(message)
    }

    return { pullRequestURL, pullCreated, user: { id, login } }
}
