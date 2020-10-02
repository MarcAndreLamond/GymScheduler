/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createSchedule = /* GraphQL */ `
  mutation CreateSchedule(
    $input: CreateScheduleInput!
    $condition: ModelscheduleConditionInput
  ) {
    createSchedule(input: $input, condition: $condition) {
      id
      start
      end
      title
      client
      mail
      phone
      nbClient
      price
      createdAt
      updatedAt
    }
  }
`;
export const updateSchedule = /* GraphQL */ `
  mutation UpdateSchedule(
    $input: UpdateScheduleInput!
    $condition: ModelscheduleConditionInput
  ) {
    updateSchedule(input: $input, condition: $condition) {
      id
      start
      end
      title
      client
      mail
      phone
      nbClient
      price
      createdAt
      updatedAt
    }
  }
`;
export const deleteSchedule = /* GraphQL */ `
  mutation DeleteSchedule(
    $input: DeleteScheduleInput!
    $condition: ModelscheduleConditionInput
  ) {
    deleteSchedule(input: $input, condition: $condition) {
      id
      start
      end
      title
      client
      mail
      phone
      nbClient
      price
      createdAt
      updatedAt
    }
  }
`;
