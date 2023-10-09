import type { Logger } from '@adonisjs/core/logger'
import { GraphQLClient, gql } from 'graphql-request'

const ALLOWED_USERNAMES = [
  'thetutlage',
  'julien-r44',
  'mcsneaky',
  'targos',
  'romainlanz',
  'roonie007',
  'baekilda',
  'armgitaar',
  'ashokgelal',
  'anishghimire862',
  'janl',
  'a21y',
  'adamcikado',
  'zlpkhr',
  'eidellev',
  'joshmanders',
  'pieterletsdial',
  'cloleb', // via "AlekStudioIntellisoft"
  'shiny', // via "KeqinHQ"
  'JASON-SHQ', // via "KeqinHQ"
  'redeyesovo', // via "KeqinHQ"
  'tpoisseau', // via "Zakodium"
]

/**
 * Returns true when the user is sponsoring with amount greater than
 * 19 dollars
 */
export async function isSponsoring(username: string, logger: Logger) {
  if (ALLOWED_USERNAMES.includes(username.toLowerCase())) {
    return true
  }

  const query = gql`query {
    user(login: "${username}") {
      sponsorshipForViewerAsSponsorable(activeOnly: true) {
        tier {
          name
          monthlyPriceInDollars
        }
      }
    }
  }`

  try {
    const response: any = await new GraphQLClient('https://api.github.com/graphql', {
      headers: {
        authorization: `bearer ${process.env.GITHUB_API_SECRET!}`,
      },
    }).request(query)

    const sponsorship = response.user.sponsorshipForViewerAsSponsorable
    logger.info({ sponsorship, username }, 'Sponsorship details')
    if (!sponsorship || !sponsorship.tier) {
      return false
    }

    return sponsorship.tier.monthlyPriceInDollars >= 19
  } catch (error) {
    logger.error({ err: error }, 'Github graphQL request failed')
    return true
  }
}
