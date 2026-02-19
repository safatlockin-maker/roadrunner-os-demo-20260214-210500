import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = 'AIzaSyCMrNo38IY3Lg5DSFT8SMU78XxdyeD_QQE';
const genAI = new GoogleGenerativeAI(apiKey);

console.log('Testing Gemini API...');

try {
  // Test 1: Basic generateContent
  console.log('\n--- Test 1: Basic generateContent ---');
  const model1 = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result1 = await model1.generateContent('Say hello in one word');
  console.log('Response:', result1.response.text());

  // Test 2: With systemInstruction
  console.log('\n--- Test 2: With systemInstruction ---');
  const model2 = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: 'You are a helpful assistant. Be very brief.',
  });
  const result2 = await model2.generateContent('What is 2+2?');
  console.log('Response:', result2.response.text());

  // Test 3: Chat with startChat
  console.log('\n--- Test 3: Chat with startChat ---');
  const model3 = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: 'You are ARIA, a car sales assistant.',
  });
  const chat = model3.startChat({ history: [] });
  const result3 = await chat.sendMessage('Do you have trucks?');
  console.log('Response:', result3.response.text());

  console.log('\n✅ All tests passed!');
} catch (err) {
  console.error('\n❌ Error:', err.message);
  if (err.response) console.error('Response:', err.response);
  if (err.stack) console.error('Stack:', err.stack);
}
