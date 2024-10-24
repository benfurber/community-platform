import { useEffect, useState } from 'react'
import { useParams } from '@remix-run/react'
import { observer } from 'mobx-react-lite'
import { Button, InternalLink, Loader } from 'oa-components'
import { ProfileTypeList } from 'oa-shared'
import { useCommonStores } from 'src/common/hooks/useCommonStores'
import { incrementViewCount } from 'src/utils/incrementViewCount'
import { seoTagsUpdate } from 'src/utils/seo'
import { Flex, Text } from 'theme-ui'

import { logger } from '../../../logger'
import { MemberProfile } from './MemberProfile'
import { SpaceProfile } from './SpaceProfile'

import type { IUserDB } from 'oa-shared'
import type { UserCreatedDocs } from '../types'

/**
 * High level wrapper which loads state, then determines
 * whether to render a MemberProfile or SpaceProfile.
 */
export const UserProfile = observer(() => {
  const { id } = useParams()
  const { userStore } = useCommonStores().stores
  const [user, setUser] = useState<IUserDB | undefined>()
  const [userCreatedDocs, setUserCreatedDocs] = useState<
    UserCreatedDocs | undefined
  >()
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const userId = id

    if (userId) {
      const fetchUserData = async () => {
        try {
          const userData = await userStore.getUserProfile(userId)
          if (userData as IUserDB) {
            setUser(userData)

            incrementViewCount({
              document: userData,
              documentType: 'user',
              store: userStore,
            })

            seoTagsUpdate({
              title: `${userData.displayName} - Profile`,
            })
          }
        } catch (error) {
          logger.error('Error getting user profile', error)
        }
      }

      const fetchUserDocs = async () => {
        try {
          const docs = await userStore.getUserCreatedDocs(userId)
          setUserCreatedDocs(docs)
          setIsLoading(false)
        } catch (error) {
          logger.error('Error getting user created docs', error)
        }
      }

      fetchUserData()
      fetchUserDocs()
    }
  }, [id])

  if (isLoading) {
    return <Loader />
  }

  if (!user) {
    return (
      <Text
        sx={{
          width: '100%',
          textAlign: 'center',
          display: 'block',
          marginTop: 10,
        }}
      >
        User not found
      </Text>
    )
  }

  const isViewingOwnProfile =
    userStore.activeUser && user && userStore.activeUser._id === user._id
  const showMemberProfile =
    user.profileType === ProfileTypeList.MEMBER ||
    user.profileType === undefined

  return (
    <Flex
      sx={{
        alignSelf: 'center',
        maxWidth: showMemberProfile ? '42em' : '60em',
        flexDirection: 'column',
        width: '100%',
        marginTop: isViewingOwnProfile ? 4 : [6, 8],
        gap: 4,
      }}
    >
      {isViewingOwnProfile && (
        <InternalLink
          sx={{
            alignSelf: ['center', 'flex-end'],
            marginBottom: showMemberProfile ? [2, 0] : 0,
            zIndex: 2,
          }}
          to="/settings"
        >
          <Button type="button" data-cy="EditYourProfile">
            Edit Your Profile
          </Button>
        </InternalLink>
      )}

      {showMemberProfile ? (
        <MemberProfile
          data-cy="memberProfile"
          user={user}
          docs={userCreatedDocs}
        />
      ) : (
        <SpaceProfile
          data-cy="spaceProfile"
          user={user}
          docs={userCreatedDocs}
        />
      )}
    </Flex>
  )
})
