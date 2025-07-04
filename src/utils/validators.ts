import { getSpecialCharacters, stripSpecialCharacters } from './helpers'
import { isUrl } from './urlHelper'

/****************************************************************************
 *            General Validation Methods
 * **************************************************************************/

const required = (value: any) => {
  return value ? undefined : 'Make sure this field is filled correctly'
}

const noSpecialCharacters = (value: string) => {
  const specialCharacters = value ? getSpecialCharacters(value) : ''
  return specialCharacters.length > 0
    ? 'Only letters and numbers are allowed'
    : undefined
}

const maxValue = (max: number) => (value) => {
  const strippedString = stripSpecialCharacters(value)

  return strippedString.length > max
    ? `Should be less or equal to ${max} characters`
    : undefined
}

const minValue = (min: number) => (value) => {
  const strippedString = stripSpecialCharacters(value)

  return strippedString.length < min
    ? `Should be more than ${min} characters`
    : undefined
}

const endsWithQuestionMark = () => (value) => {
  const lastCharacter = value ? value.slice(-1) : ''
  return lastCharacter !== '?' ? 'Needs to end with a question mark' : undefined
}

const composeValidators =
  (...validators) =>
  async (value) => {
    const allResponse = await Promise.all(
      validators.map((validator) => validator(value)),
    )

    return allResponse.reduce(
      (message, value) =>
        typeof value === 'string' ? (message += value + '. ') : message,
      '',
    )
  }

const validateUrl = (value: any) => {
  if (value) {
    return isUrl(value) ? undefined : 'Invalid url'
  }
  return 'Required'
}

const validateUrlAcceptEmpty = (value: any) => {
  if (value) {
    return isUrl(value) ? undefined : 'Invalid url'
  }
}

const validateEmail = (value: string) => {
  if (value) {
    return isEmail(value) ? undefined : 'Invalid email'
  }
  return 'Required'
}

const isEmail = (email: string) => {
  // From this stackoverflow thread https://stackoverflow.com/a/46181
  // eslint-disable-next-line
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(String(email).toLowerCase())
}

/** Validator method to pass to react-final-form. Takes a given title,
 *  converts to corresponding slug and checks uniqueness.
 *  Provide originalId to prevent matching against own entry.
 *  NOTE - return value represents the error, so FALSE actually means valid
 */
const validateTitle = () => (title?: string) => {
  if (!title) {
    // if no title submitted, simply return message to say that it is required
    return 'Required'
  }

  return false
}

const draftValidationWrapper = (value, allValues, validator) => {
  return allValues.allowDraftSave ? undefined : validator(value)
}

/****************************************************************************
 *            FORM MUTATORS
 * **************************************************************************/

const addProtocolMutator = ([name], state, { changeValue }) => {
  changeValue(state, name, (val: string) => ensureExternalUrl(val))
}
/**
 * Used for user input links, ensure url has http/https protocol as required for external linking,
 * E.g. https://instagram.com/my-username
 */
const ensureExternalUrl = (url: string) =>
  typeof url === 'string' && url.indexOf('://') === -1 ? `https://${url}` : url

export {
  validateUrl,
  validateUrlAcceptEmpty,
  validateEmail,
  draftValidationWrapper,
  required,
  addProtocolMutator,
  ensureExternalUrl,
  maxValue,
  minValue,
  composeValidators,
  validateTitle,
  noSpecialCharacters,
  endsWithQuestionMark,
}
