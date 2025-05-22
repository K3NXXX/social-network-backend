import { PartialType } from '@nestjs/mapped-types';

export class CommentDto {
  content: string;
  postId: string;
  parentId?: string;
}

export class UpdateCommentDto extends PartialType(CommentDto) {}
