const STATUS_MESSAGES = {
  // 1xx Informational Responses
  100: "Continue: The server has received the request headers and the client should proceed to send the request body.",
  101: "Switching Protocols: The requester has asked the server to switch protocols.",
  102: "Processing: The server is processing the request, but no response is available yet.",
  103: "Early Hints: The server is returning some headers before final response.",

  // 2xx Success
  200: "OK: The request was successful.",
  201: "Created: The request was successful, and a new resource was created.",
  202: "Accepted: The request has been received but not yet acted upon.",
  203: "Non-Authoritative Information: The returned metadata is not from the origin server.",
  204: "No Content: The server successfully processed the request, but no content is returned.",
  205: "Reset Content: The server successfully processed the request and requests the client to reset its view.",
  206: "Partial Content: The server is delivering only part of the resource.",

  // 3xx Redirection
  300: "Multiple Choices: The request has more than one possible response.",
  301: "Moved Permanently: The resource has been moved permanently to a new URL.",
  302: "Found: The resource is temporarily available at a different URI.",
  303: "See Other: The response can be found at a different URI using a GET method.",
  304: "Not Modified: The resource has not been modified since the last request.",
  307: "Temporary Redirect: The resource is temporarily located at another URI.",
  308: "Permanent Redirect: The resource has been permanently moved to a new URI.",

  // 4xx Client Errors
  400: "Bad Request: The server could not understand the request due to invalid syntax.",
  401: "Unauthorized: Authentication is required or has failed.",
  402: "Payment Required: Reserved for future use.",
  403: "Forbidden: The client does not have access rights to the content.",
  404: "Not Found: The server could not find the requested resource.",
  405: "Method Not Allowed: The method specified in the request is not allowed.",
  406: "Not Acceptable: The requested resource is capable of generating only content not acceptable according to the Accept headers sent in the request.",
  407: "Proxy Authentication Required: Authentication with a proxy is required.",
  408: "Request Timeout: The server timed out waiting for the request.",
  409: "Conflict: The request conflicts with the current state of the server.",
  410: "Gone: The requested content has been permanently deleted.",
  411: "Length Required: The request did not specify the length of its content.",
  412: "Precondition Failed: The server does not meet one of the preconditions specified in the request.",
  413: "Payload Too Large: The request is larger than the server is willing or able to process.",
  414: "URI Too Long: The URI requested by the client is too long.",
  415: "Unsupported Media Type: The media format of the requested data is not supported.",
  416: "Range Not Satisfiable: The requested range cannot be fulfilled.",
  417: "Expectation Failed: The server cannot meet the requirements of the Expect header.",
  418: "I'm a Teapot: Fun response indicating the server refuses to brew coffee.",
  422: "Unprocessable Entity: The request was well-formed but could not be processed.",
  429: "Too Many Requests: The user has sent too many requests in a given time frame.",

  // 5xx Server Errors
  500: "Internal Server Error: The server encountered a situation it doesn't know how to handle.",
  501: "Not Implemented: The server does not support the request method.",
  502: "Bad Gateway: The server received an invalid response from the upstream server.",
  503: "Service Unavailable: The server is not ready to handle the request.",
  504: "Gateway Timeout: The server did not receive a timely response from an upstream server.",
  505: "HTTP Version Not Supported: The HTTP version used in the request is not supported by the server.",
  506: "Variant Also Negotiates: Transparent content negotiation resulted in a circular reference.",
  507: "Insufficient Storage: The server is unable to store the representation needed to complete the request.",
  508: "Loop Detected: The server detected an infinite loop while processing the request.",
  510: "Not Extended: Further extensions to the request are required for the server to fulfill it.",
  511: "Network Authentication Required: Authentication is required to gain network access.",
};

module.exports = STATUS_MESSAGES;
