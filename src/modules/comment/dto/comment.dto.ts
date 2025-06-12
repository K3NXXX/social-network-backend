import { PartialType } from '@nestjs/mapped-types';

import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CommentDto {
	@IsString()
	@IsNotEmpty()
	content: string;

	@IsString()
	@IsNotEmpty()
	postId: string;

	@IsOptional()
	@IsString()
	parentId?: string;
}

export class UpdateCommentDto extends PartialType(CommentDto) {}
