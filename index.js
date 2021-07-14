const AWS = require('aws-sdk');
AWS.config.update({
  region: 'us-east-2',
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const dynamoDBTable = 'test_table';
const testPath = '/test';
const testTestPath = '/test-test';

exports.handler = async (event) => {
  let response;

  switch (true) {
    case event.httpMethod === 'GET' && event.path === testPath:
      response = buildResponse(200, 'Hello');
      break;
    case event.httpMethod === 'GET' && event.path === testTestPath:
      response = await getItem(event.queryStringParameters.id);
      break;
    case event.httpMethod === 'POST' && event.path === testTestPath:
      console.log(JSON.parse(event.body));
      response = await saveItem(JSON.parse(event.body));
      break;
    case event.httpMethod === 'PATCH' && event.path === testTestPath:
      const requestBody = JSON.parse(event.body);
      const updateId = requestBody.id;
      const updateKey = requestBody.updateKey;
      const updateValue = requestBody.updateValue;
      response = await modifyItem(updateId, updateKey, updateValue);
      break;
    case event.httpMethod === 'DELETE' && event.path === testTestPath:
      response = await deleteItem(JSON.parse(event.body).id);
      break;
  }
  return response;
};

/**
 * Build return response
 * @param {int} statusCode
 * @param {object} body
 * @return {object}
 */
function buildResponse(statusCode, body) {
  const response = {
    statusCode: statusCode,
    headers: {
      'Content-Type': 'Application/Json',
    },
    body: JSON.stringify(body),
  };

  return response;
}

/**
 * Get an item
 * @param {int} id
 */
async function getItem(id) {
  const params = {
    TableName: dynamoDBTable,
    Key: {
      'id': id,
    },
  };

  return await dynamoDB.get(params).promise().then((response) => {
    return buildResponse(200, response.Item);
  }).catch((err) => {
    const body = {
      Operation: 'GET',
      Message: 'FAILED',
      Item: err,
    };
    return buildResponse(400, body);
  });
}

/**
 * Update an item
 * @param {int} id
 * @param {string} updateKey
 * @param {string|int} updateValue
 */
async function modifyItem(id, updateKey, updateValue) {
  const params = {
    TableName: dynamoDBTable,
    Key: {
      'id': id,
    },
    UpdateExpression: `set ${updateKey} = :value`,
    ExpressionAttributeValues: {
      ':value': updateValue,
    },
    ReturnValues: 'UPDATED_NEW',
  };

  return await dynamoDB.update(params).promise().then((response) => {
    const body = {
      Operation: 'UPDATE',
      Message: 'SUCCESS',
      Item: response,
    };

    return buildResponse(200, body);
  }).catch((err) => {
    return buildResponse(400, err);
  });
}

/**
 * Delete an item
 * @param {int} id
 */
async function deleteItem(id) {
  const params = {
    TableName: dynamoDBTable,
    Key: {
      'id': id,
    },
    ReturnValues: 'ALL_OLD',
  };

  return await dynamoDB.delete(params).promise().then((response) => {
    const body = {
      Operation: 'DELETE',
      Message: 'SUCCESS',
      Item: response,
    };

    return buildResponse(200, body);
  }).catch((err) => {
    return buildResponse(400, body);
  });
}

/**
 * Create an item
 * @param {object} requestBody
 */
async function saveItem(requestBody) {
  const params = {
    TableName: dynamoDBTable,
    Item: requestBody,
  };

  return await dynamoDB.put(params).promise().then((response) => {
    const body = {
      Operation: 'SAVE',
      Message: 'SUCCESS',
      Item: requestBody,
    };

    return buildResponse(200, body);
  }).catch((err) => {
    return buildResponse(400, err);
  });
}
