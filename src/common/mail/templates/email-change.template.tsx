import { Html } from '@react-email/html';
import * as React from 'react';
import {
	Body,
	Container,
	Heading,
	Section,
	Tailwind,
	Text,
} from '@react-email/components';

export function EmailChangeTemplate(code: number) {
	return (
		<Tailwind>
			<Html>
				<Body className='bg-white text-black font-sans p-6'>
					<Container className='max-w-xl mx-auto border border-gray-200 rounded-md p-6 shadow-sm'>
						<Heading className='text-xl font-semibold mb-4 text-black'>
							Confirm your new email
						</Heading>

						<Text className='text-sm text-gray-800 mb-4'>Hello,</Text>

						<Text className='text-sm text-gray-800 mb-4'>
							You requested to change the email address associated with your
							VETRA account. To confirm this change, please use the verification
							code below:
						</Text>

						<Section className='bg-gray-100 border border-gray-300 rounded-xl px-4 py-2 mb-4 text-center'>
							<Text className='text-2xl font-mono tracking-widest text-black'>
								{code}
							</Text>
						</Section>

						<Text className='text-sm text-gray-700 mb-4'>
							This code is valid for <strong>15 minutes</strong>. If the code
							expires, you can request a new one by attempting to change your
							email again.
						</Text>

						<Text className='text-xs text-gray-500 border-t pt-4 mt-6'>
							&copy; {new Date().getFullYear()} VETRA. All rights reserved.
						</Text>
					</Container>
				</Body>
			</Html>
		</Tailwind>
	);
}
