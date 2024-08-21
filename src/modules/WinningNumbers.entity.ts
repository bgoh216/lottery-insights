import { Entity, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Draw } from './Draw.entity.js';

@Entity()
export class WinningNumbers {
    @PrimaryKey()
    @OneToOne(() => Draw, (draw) => draw.winning_numbers)
    draw_no!: number;

    @Property()
    winning_number_1!: number;

    @Property()
    winning_number_2!: number;

    @Property()
    winning_number_3!: number;

    @Property()
    winning_number_4!: number;

    @Property()
    winning_number_5!: number;

    @Property()
    winning_number_6!: number;

    @Property()
    additional_number!: number;
}