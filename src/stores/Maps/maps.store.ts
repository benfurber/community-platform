import { action, makeObservable, observable } from 'mobx'
import { IModerationStatus, ProfileTypeList } from 'oa-shared'
import { logger } from 'src/logger'
import { DEFAULT_PUBLIC_CONTACT_PREFERENCE } from 'src/pages/UserSettings/constants'
import { getValidTags } from 'src/utils/getValidTags'
import { hasAdminRights, needsModeration } from 'src/utils/helpers'

import { ModuleStore } from '../common/module.store'
import { getUserAvatar } from '../User/user.store'

import type {
  IMapGrouping,
  IMapPin,
  IMapPinDetail,
  IMapPinWithDetail,
  IUploadedFileMeta,
  IUser,
  IUserDB,
} from 'oa-shared'
import type { IDBEndpoint } from 'src/models/dbEndpoints'
import type { IRootStore } from '../RootStore'

const COLLECTION_NAME: IDBEndpoint = 'mappins'
export class MapsStore extends ModuleStore {
  public activePinFilters: Array<IMapGrouping> = []
  public activePin: IMapPin | IMapPinWithDetail | undefined = undefined
  public mapPins: Array<IMapPin> = []
  public filteredPins: Array<IMapPin> = []
  // eslint-disable-next-line
  constructor(rootStore: IRootStore) {
    super(rootStore)
    makeObservable(this, {
      activePinFilters: observable,
      activePin: observable,
      mapPins: observable,
      filteredPins: observable,
      processDBMapPins: action,
    })
  }

  public processDBMapPins(pins: IMapPin[]) {
    if (pins.length === 0) {
      this.mapPins = []
      return
    }
    // HACK - CC - 2019/11/04 changed pins api, so any old mappins will break
    // this filters out. In future should run an upgrade script (easier once deployed)
    // HACK - ARH - 2019/12/09 filter unaccepted pins, should be done serverside
    const activeUser = this.activeUser
    const isAdmin = hasAdminRights(activeUser as IUser)

    pins = pins
      .filter((p) => {
        const isDeleted = p._deleted || false
        const isPinAccepted = p.moderation === IModerationStatus.ACCEPTED
        const wasCreatedByUser = activeUser && p._id === activeUser.userName
        const isAdminAndAccepted =
          isAdmin && p.moderation !== IModerationStatus.REJECTED

        return (
          p.type &&
          !isDeleted &&
          (isPinAccepted || wasCreatedByUser || isAdminAndAccepted)
        )
      })
      .map((p) => {
        return { ...p, verified: this.aggregationsStore.isVerified(p._id) }
      })
    this.mapPins = pins
  }

  // get base pin geo information
  public async getPin(id: string, source: 'server' | 'cache' = 'cache') {
    const pin = await this.db
      .collection<IMapPin>(COLLECTION_NAME)
      .doc(id)
      .get(source)
    logger.debug({ pin }, 'MapsStore.getPin')
    return pin as IMapPin
  }

  public needsModeration(pin: IMapPin) {
    return needsModeration(pin, this.activeUser as IUser)
  }

  public async setUserPin(user: IUserDB) {
    const {
      _id,
      _lastActive,
      about,
      badges,
      coverImages,
      displayName,
      isContactableByPublic,
      location,
      profileType,
      userImage,
      verified,
    } = user
    const type = profileType || ProfileTypeList.MEMBER
    const existingPin = await this.getPin(_id, 'server')
    const existingModeration = existingPin?.moderation
    const existingPinType = existingPin?.type

    let moderation: IModerationStatus = existingModeration

    const isMember = type === ProfileTypeList.MEMBER
    const tags = user.tags && getValidTags(user.tags)

    // Member pins do not require moderation.
    if (isMember) {
      moderation = IModerationStatus.ACCEPTED
    }

    // Require re-moderation for non-member pins if pin type changes or if pin was not previously accepted.
    if (
      !isMember &&
      (existingModeration !== IModerationStatus.ACCEPTED ||
        existingPinType !== type)
    ) {
      moderation = IModerationStatus.AWAITING_MODERATION
    }

    const coverImage =
      coverImages && coverImages[0]?.downloadUrl
        ? { coverImage: coverImages[0].downloadUrl }
        : {}

    const pin: IMapPin = {
      _id,
      _deleted: !user.location?.latlng,
      location: location!.latlng,
      type,
      moderation,
      verified,
      creator: {
        _id,
        _lastActive: _lastActive || '',
        ...(about ? { about } : {}),
        ...(badges
          ? {
              badges: {
                verified: badges.verified || false,
                supporter: badges.supporter || false,
              },
            }
          : {}),
        countryCode: location?.countryCode || '',
        ...coverImage,
        displayName,
        isContactableByPublic:
          isContactableByPublic || DEFAULT_PUBLIC_CONTACT_PREFERENCE,
        profileType,
        ...(tags ? { tags } : {}),
        ...(userImage ? { userImage: userImage.downloadUrl } : {}),
      },
    }

    logger.debug('setting user pin', pin)
    await this.db.collection<IMapPin>(COLLECTION_NAME).doc(pin._id).set(pin)
  }

  public async deleteUserPin(user: IUser) {
    const pin = await this.getPin(user.userName, 'server')

    logger.debug('marking user pin deleted', pin)

    await this.db.collection<IMapPin>(COLLECTION_NAME).doc(pin._id).update({
      _deleted: true,
    })
  }

  // return subset of profile info used when displaying map pins
  private async getUserProfilePin(username: string): Promise<IMapPinDetail> {
    const u = await this.userStore.getUserProfile(username)
    if (!u) {
      return {
        heroImageUrl: '',
        profilePicUrl: '',
        shortDescription: '',
        name: username,
        displayName: username,
        profileUrl: `${window.location.origin}/u/${username}`,
        verifiedBadge: false,
        country: null,
      }
    }
    const avatar = getUserAvatar(username)
    let heroImageUrl = ''
    if (u.coverImages && u.coverImages.length > 0) {
      heroImageUrl = (u.coverImages[0] as IUploadedFileMeta).downloadUrl
    }

    return {
      heroImageUrl,
      profilePicUrl: avatar,
      shortDescription: u.mapPinDescription ? u.mapPinDescription : '',
      name: u.userName,
      displayName: u.displayName,
      profileUrl: `${window.location.origin}/u/${u.userName}`,
      verifiedBadge: !!u.badges?.verified,
      country: u.location?.countryCode || u.country?.toLowerCase() || null,
    }
  }
}
