import type { NodeFormDefinition } from '../../types';

import { definition as nodeAiNode } from './ai-node';
import { definition as nodeAwsLambda } from './aws-lambda';
import { definition as nodeAwsSns } from './aws-sns';
import { definition as nodeAwsSqs } from './aws-sqs';
import { definition as nodeAzureIotHub } from './azure-iot-hub';
import { definition as nodeGcpPubsub } from './gcp-pubsub';
import { definition as nodeKafka } from './kafka';
import { definition as nodeMqtt } from './mqtt';
import { definition as nodeRabbitmq } from './rabbitmq';
import { definition as nodeRestApiCall } from './rest-api-call';
import { definition as nodeSendEmail } from './send-email';
import { definition as nodeSendNotification } from './send-notification';
import { definition as nodeSendSms } from './send-sms';
import { definition as nodeSendToSlack } from './send-to-slack';

export const externalNodeForms: Record<string, NodeFormDefinition> = {
  'ai-node': nodeAiNode,
  'send-sms': nodeSendSms,
  'send-notification': nodeSendNotification,
  'send-email': nodeSendEmail,
  'rest-api-call': nodeRestApiCall,
  rabbitmq: nodeRabbitmq,
  kafka: nodeKafka,
  'gcp-pubsub': nodeGcpPubsub,
  'send-to-slack': nodeSendToSlack,
  'aws-lambda': nodeAwsLambda,
  'aws-sns': nodeAwsSns,
  'aws-sqs': nodeAwsSqs,
  'azure-iot-hub': nodeAzureIotHub,
  mqtt: nodeMqtt,
};
